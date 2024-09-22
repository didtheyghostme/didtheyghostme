export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-8 md:py-10">
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}
