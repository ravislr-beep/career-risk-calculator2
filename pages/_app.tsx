import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Nav from '../components/Nav'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Nav />
      <main className="max-w-4xl mx-auto p-4">
        <Component {...pageProps} />
      </main>
    </>
  )
}
