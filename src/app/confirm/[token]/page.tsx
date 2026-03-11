import ConfirmPageClient from "./ConfirmPageClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ConfirmPage({ params }: Props) {
  const { token } = await params;
  return <ConfirmPageClient token={token} />;
}