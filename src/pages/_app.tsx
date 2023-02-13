import React from 'react';
import type { AppProps } from 'next/app'
import Head from 'next/head';

import '@/styles/globals.scss'
import { Logo } from '@/components/Logo';
import { Container } from '@/components/Container';
import { Footer } from '@/components/Footer';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Scrummy</title>
        <meta name="description" content="" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="apple-touch-icon" href="/gfx/apple-touch-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="72x72"   href="/gfx/apple-touch-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/gfx/apple-touch-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/gfx/apple-touch-icon-144x144.png" />

        <meta name="msapplication-TileImage" content="gfx/metro-tile.png"/>
        <meta name="msapplication-TileColor" content="#187534"/>

        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </Head>
      <Logo />
      <Container>
        <Component {...pageProps} />
      </Container>
      <Footer />
    </>
  );
}
