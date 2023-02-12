import React from 'react';
import type { AppProps } from 'next/app'
import Head from 'next/head';

import '@/styles/globals.scss'
import { Logo } from '@/components/Logo';
import { Container } from '@/components/Container';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Scrummy</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Logo/>
      <Container>
        <Component {...pageProps} />
      </Container>
    </>
  );
}
