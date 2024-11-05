export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="">
      <div className="container mx-auto px-4">{children}</div>
    </section>
  );
}
