import { PrismaService } from '@/core/prisma/prisma.service';
import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginInput } from './inputs/login.input';
import { verify } from 'argon2';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { getSessionMetadata } from '@/shared/utils/session-metadata.util';

@Injectable()
export class SessionService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService
    ) { }

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
        return new Promise((resolve, reject) => {
            req.session.createdAt = new Date();
            req.session.userId = user.id
            req.session.metadata = metadata

            req.session.save(err => {
                if (err) {
                    return reject(
                        new InternalServerErrorException('Не удалось сохранить сессию')
                    )
                }

                resolve(user)
            })

        })
    }

    public async logout(req: Request) {
        return new Promise((resolve, reject) => {
            req.session.destroy(err => {
                if (err) {
                    return reject(
                        new InternalServerErrorException('Не удалось завершить сессию')
                    )
                }

                req.res?.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'))
                resolve(true)
            })

        })
    }
}
