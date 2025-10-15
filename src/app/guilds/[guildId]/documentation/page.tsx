"use client";

import { DocumentationList } from "@/features/documentation";
import { useGuildRouteContext } from "@/features/guilds/context";

const GuildDocumentationPage = () => {
  const { guildName } = useGuildRouteContext();

  return <DocumentationList guildName={guildName} />;
};

export default GuildDocumentationPage;

