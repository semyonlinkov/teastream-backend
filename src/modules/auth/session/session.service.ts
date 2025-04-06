import { PrismaService } from '@/core/prisma/prisma.service';
import { ConflictException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginInput } from './inputs/login.input';
import { verify } from 'argon2';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getSessionMetadata } from '@/shared/utils/session-metadata.util';
import { RedisService } from '@/core/redis/redis.service';
import { destroySession, saveSession } from '@/shared/utils/session.util';

@Injectable()
export class SessionService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly redisService: RedisService,
        private readonly configService: ConfigService
    ) { }

    public async findByUser(req: Request) {
        const userId = req.session.userId

        if (!userId) {
            throw new NotFoundException('Пользователь не обнаружен в сессии')
        }

        const keys = await this.redisService.keys('*')

        const userSessions: any = [];

        for (const key of keys!) {
            const sessionData: any = await this.redisService.get(key);

            if (sessionData) {
                const session = JSON.parse(sessionData)

                if (session.userId === userId) {
                    userSessions.push({
                        ...session,
                        id: key.split(':')[1]
                    })
                }
            }
        }

        userSessions.sort((a, b) => b.createdAt - a.createdAt)

        return userSessions.filter(session => session.id === req.session.id);
    }

    public async findCurrent(req: Request) {
        const sessionId = req.session.id;

        const sessionData = await this.redisService.get(
            `${this.configService.getOrThrow<string>("SESSION_FOLDER")}${sessionId}`
        )

        const session = JSON.parse(sessionData as string);

        return {
            ...session,
            id: sessionId
        }

    }

    public async login(req: Request, input: LoginInput, userAgent: string) {
        const { login, password } = input;

        const user = await this.prismaService.user.findFirst({
            where: {
                OR: [
                    { username: { equals: login } },
                    { email: { equals: login } }
                ]
            }
        })

        if (!user) {
            throw new NotFoundException('Пользователь не найден')
        }

        const isValidPassword = await verify(user.password, password);

        const metadata = getSessionMetadata(req, userAgent)

        if (!isValidPassword) {
            throw new UnauthorizedException('Неверный пароль')
        }

        // сохраняем сессию 1:58:13
        return saveSession(req, user, metadata)
    }

    public async logout(req: Request) {
        return destroySession(req, this.configService)
    }

    public async clearSession(req: Request) {
        req.res?.clearCookie(
            this.configService.getOrThrow<string>('SESSION_NAME')
        )
        return true
    }

    public async remove(req: Request, id: string) {
        if (req.session.id === id) {
            throw new ConflictException('Текущую сессию удалить нельзя');
        }

        await this.redisService.del(
            `${this.configService.getOrThrow<string>('SESSION_FOLDER')}${id}`
        )

        return true
    }
}
