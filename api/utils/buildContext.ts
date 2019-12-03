import { Request, Response } from "express";
import { verify } from "jsonwebtoken";

import { SECRET } from "../consts";
import { IUser, UserTable } from "../db/tables";
import { AuthResolver } from "../resolvers/auth";

export const buildContext = async ({
  req,
  res,
}: {
  req: Request;
  res: Response;
}) => {
  let user: IUser | undefined;
  let token: string | undefined;
  try {
    const authorizationToken: string | undefined =
      req.cookies.authorization || req.headers.authorization;
    if (authorizationToken) {
      const userJWT = verify(authorizationToken, SECRET) as {
        email: string;
      };

      user = await UserTable()
        .select("*")
        .where({ email: userJWT.email, locked: false })
        .first();
      if (user) {
        token = AuthResolver.authenticate({
          req,
          res,
          email: userJWT.email,
        });
      }
    }
  } catch (err) {}

  return {
    req,
    res,
    user,
    token,
  };
};
