import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { SessionService } from './session.service';
import { UserModel } from '../account/models/user.model';
import { GqlContext } from '@/shared/types/gql-context.types';
import { LoginInput } from './inputs/login.input';
import { UserAgent } from '@/shared/decorators/user-agent.decorator';

@Resolver('Session')
export class SessionResolver {
    constructor(private readonly sessionService: SessionService) { }

    @Mutation(() => UserModel, { name: 'loginUser' })
    public async login(
        @Context() { req }: GqlContext,
        @Args('data') input: LoginInput,
        @UserAgent() userAgent: string
    ) {
        return this.sessionService.login(req, input, userAgent)
    }

    @Mutation(() => Boolean, { name: 'logoutUser' })
    public async logout(
        @Context() { req }: GqlContext,
    ) {
        return this.sessionService.logout(req)
    }
}
