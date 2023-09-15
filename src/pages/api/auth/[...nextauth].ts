import NextAuth from "next-auth";

import { authOptions } from "~/server/packages/auth";

export default NextAuth(authOptions);
