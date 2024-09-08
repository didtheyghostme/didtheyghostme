import { Link, Snippet, Code, Button } from "@nextui-org/react";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import supabase from "@/lib/supabase";

export default async function Home() {
  const { data: notes } = await supabase.from("notes").select();

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg justify-center text-center">
        <h1 className={title()}>Make&nbsp;</h1>
        <h1 className={title({ color: "violet" })}>beautiful&nbsp;</h1>
        <br />
        <h1 className={title()}>
          websites regardless of your design experience.
        </h1>
        <h2 className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </h2>
      </div>

      <pre>{JSON.stringify(notes, null, 2)}</pre>

      <div className="flex gap-3">
        <Button
          isExternal
          as={Link}
          color="primary"
          href={siteConfig.links.docs}
          radius="full"
          variant="shadow"
        >
          Documentation
        </Button>
        <Button
          isExternal
          as={Link}
          href={siteConfig.links.github}
          radius="full"
          variant="bordered"
        >
          <GithubIcon size={20} />
          GitHub
        </Button>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="flat">
          <span>
            Get started by editing <Code color="primary">app/page.tsx</Code>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
