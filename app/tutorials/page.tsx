function ArcadeEmbedAddCompany() {
  return (
    <div style={{ position: "relative", paddingBottom: "calc(56.22254758418741% + 41px)", height: "0", width: "100%" }}>
      <iframe
        allowFullScreen
        allow="clipboard-write"
        loading="lazy"
        src="https://demo.arcade.software/YzZ4Ym9rWgRKc2HIoICN?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", colorScheme: "light", border: "0" }}
        title="didtheyghost.me/companies"
      />
    </div>
  );
}

function ArcadeEmbedAddJobPosting() {
  return (
    <div style={{ position: "relative", paddingBottom: "calc(56.25% + 41px)", height: "0", width: "100%" }}>
      <iframe
        allowFullScreen
        allow="clipboard-write"
        loading="lazy"
        src="https://demo.arcade.software/J4fMC28Eap5FhkZmtBBz?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", colorScheme: "light", border: "0" }}
        title="Add a Job"
      />
    </div>
  );
}

function ArcadeEmbedTrackJobApplication() {
  return (
    <div style={{ position: "relative", paddingBottom: "calc(56.25% + 41px)", height: "0", width: "100%" }}>
      <iframe
        allowFullScreen
        allow="clipboard-write"
        loading="lazy"
        src="https://demo.arcade.software/irndwKm7znh2zhJ7WKRF?embed&embed_mobile=inline&embed_desktop=inline&show_copy_link=true"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", colorScheme: "light", border: "0" }}
        title="Track a Job Application"
      />
    </div>
  );
}

export default function TutorialPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-12 p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-bold">Getting Started Tutorials</h1>
        <p className="text-default-500">Learn how to use our platform with these interactive walkthroughs</p>
      </div>

      {/* Tutorial 1: Add a Company */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How to Add a Company</h2>
        <ArcadeEmbedAddCompany />
      </section>

      {/* Tutorial 2: Add a Job Posting */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How to Add a Job</h2>
        <ArcadeEmbedAddJobPosting />
      </section>

      {/* Tutorial 3 Track a Job Application */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How to Track a Job Application</h2>
        <ArcadeEmbedTrackJobApplication />
      </section>
    </div>
  );
}
