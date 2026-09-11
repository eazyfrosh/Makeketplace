import { PublishedPremiumSite } from "@/components/premium-sites/published-premium-site";
export default async function PremiumSitePage({params}:{params:Promise<{slug:string}>}){const{slug}=await params;return <PublishedPremiumSite slug={slug}/>}
