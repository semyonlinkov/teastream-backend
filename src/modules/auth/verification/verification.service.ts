import { PrismaService } from '@/core/prisma/prisma.service';
import { MailService } from '@/modules/libs/mail/mail.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VerificationInput } from './inputs/verification.input';
import { TokenType, User } from '@prisma/generated';
import { getSessionMetadata } from '@/shared/utils/session-metadata.util';
import { saveSession } from '@/shared/utils/session.util';
import { Request } from 'express';
import { generateToken } from '@/shared/utils/generate-token.util';

@Injectable()
export class VerificationService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly mailService: MailService
    ) { }

    public async verify(req: Request, input: VerificationInput, userAgent: string) {
        const { token } = input

        const existingToken = await this.prismaService.token.findUnique({
            where: {
                token,
                type: TokenType.EMAIL_VERIFY
            }
        })

        if (!existingToken) {
            throw new NotFoundException('Токен не найден')
        }

        const hasExipired = new Date(existingToken.expiresIn) < new Date();

        if (hasExipired) {
            throw new BadRequestException("Токен истек")
        }

        const user = await this.prismaService.user.update({
            where: {
                id: existingToken.userId!
            },
            data: {
                isEmailVerified: true
            }
        })

        await this.prismaService.token.delete({
            where: {
                id: existingToken.id,
                type: TokenType.EMAIL_VERIFY
            }
        })

        const metadata = getSessionMetadata(req, userAgent)

        return saveSession(req, user, metadata)
    }

    public async sendVerificationToken(user: User) {
        const VerificationToken = await generateToken(
            this.prismaService,
            user,
            TokenType.EMAIL_VERIFY,
            true
        )

        await this.mailService.sendVerificationToken(
            user.email,
            VerificationToken.token
        )

        return true
    }
}
