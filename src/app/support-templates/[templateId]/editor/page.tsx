"use client";
import { useParams, useSearchParams } from "next/navigation";
import { SupportEditor } from "@/components/support-sites/support-editor";
export default function EditorPage(){const {templateId}=useParams<{templateId:string}>();const params=useSearchParams();return <SupportEditor templateId={templateId} siteId={params.get("site")??undefined}/>}
