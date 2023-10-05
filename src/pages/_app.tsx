import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import "~/styles/globals.css";
import { StrictMode } from "react";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <StrictMode>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </StrictMode>
  );
};

export default api.withTRPC(MyApp);
