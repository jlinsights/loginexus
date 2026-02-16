import {setRequestLocale} from 'next-intl/server';

export default function Layout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  setRequestLocale(locale);
  return children;
}
