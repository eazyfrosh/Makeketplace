"use client";
import { useParams } from "next/navigation";
import { PublishedSupportSite } from "@/components/support-sites/published-support-site";
export default function PublishedPage(){const {siteSlug}=useParams<{siteSlug:string}>();return <PublishedSupportSite slug={siteSlug}/>}
