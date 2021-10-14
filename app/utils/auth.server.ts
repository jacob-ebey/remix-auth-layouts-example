import { redirect } from "remix";
import { compare as comparePassword, hash as hashPassword } from "bcryptjs";

import type { User as PrismaUser } from "@prisma/client";

import prisma from "~/prisma.server";
import { authSession } from "~/sessions.server";

export async function parserUserId(
  cookieHeader: string | null | undefined
): Promise<string | null>;
/**
 * @throws Will throw a redirect response if the userId is not avaliable
 */
export async function parserUserId(
  cookieHeader: string | null | undefined,
  redirectToIfNotAvaliable: string
): Promise<string>;
export async function parserUserId(
  cookieHeader: string | null | undefined,
  redirectToIfNotAvaliable?: string
): Promise<string | null> {
  let session = await authSession.getSession(cookieHeader);

  if (!session.has("userId")) {
    if (redirectToIfNotAvaliable) {
      throw redirect(redirectToIfNotAvaliable);
    }

    return null;
  }

  return session.get("userId");
}

export type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  firstName: string;
  newsletter: boolean;
};

function cleanupUser<
  TResult = User,
  TUser extends Partial<PrismaUser> = PrismaUser
>(user: TUser): TResult {
  return {
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    firstName: user.firstName,
    newsletter: user.newsletter,
  } as unknown as TResult;
}

export async function loadUser(
  cookieHeader: string | null | undefined
): Promise<User | null>;
/**
 * @throws Will throw a redirect response if the user is not avaliable
 */
export async function loadUser(
  cookieHeader: string | null | undefined,
  redirectToIfNotAvaliable: string
): Promise<User>;
export async function loadUser(
  cookieHeader: string | null | undefined,
  redirectToIfNotAvaliable?: string
): Promise<User | null> {
  let userId = await parserUserId(
    cookieHeader,
    redirectToIfNotAvaliable as never
  );

  if (!userId) {
    return null;
  }

  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return null;
  }

  return cleanupUser(user);
}

export async function login(
  email: string,
  password: string
): Promise<{ id: string } | null> {
  let user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: { select: { hash: true } },
    },
  });

  if (!user || !(await comparePassword(password, user.password.hash))) {
    return null;
  }

  return cleanupUser(user);
}

export type SignupData = {
  email: string;
  firstName: string;
  newsletter: boolean;
};

export async function signup(data: SignupData, password: string) {
  let hash = await hashPassword(password, 10);

  let user = await prisma.user.create({
    data: {
      ...data,
      password: {
        create: {
          hash,
        },
      },
    },
  });

  return cleanupUser(user);
}
