"use client";
import { useParams, useSearchParams } from "next/navigation";
import { SupportEditor } from "@/components/support-sites/support-editor";
import { LicenseGuard } from "@/components/platform/license-guard";
export default function EditorPage(){const {templateId}=useParams<{templateId:string}>();const params=useSearchParams();return <LicenseGuard serviceSlug="support-website-templates" themeClass=""><SupportEditor templateId={templateId} siteId={params.get("site")??undefined}/></LicenseGuard>}
