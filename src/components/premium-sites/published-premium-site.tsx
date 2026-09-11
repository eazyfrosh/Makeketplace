"use client";
import { useEffect, useState } from "react";
import { getPublishedPremiumSite } from "@/lib/premium-sites/client";
import type { PremiumSite } from "@/lib/premium-sites/types";
import { VolterraSite } from "./volterra-site";
export function PublishedPremiumSite({slug}:{slug:string}){const[site,setSite]=useState<PremiumSite|null>();useEffect(()=>{getPublishedPremiumSite(slug).then(setSite)},[slug]);if(site===undefined)return <div className="grid min-h-screen place-items-center">Loading website…</div>;if(!site)return <div className="grid min-h-screen place-items-center text-center"><div><h1 className="text-3xl font-semibold">Website unavailable</h1><p className="mt-2 text-muted-foreground">This premium website has not been published.</p></div></div>;return <VolterraSite site={site}/>}
