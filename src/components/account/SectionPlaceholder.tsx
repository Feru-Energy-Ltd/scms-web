export default function SectionPlaceholder({
  title,
  description,
}: Readonly<{
  title: string;
  description: string;
}>) {
  return (
    <section>
      <h1 style={{ marginBottom: 8 }}>{title}</h1>
      <p style={{ color: "var(--color-text-muted)" }}>{description}</p>
    </section>
  );
}
