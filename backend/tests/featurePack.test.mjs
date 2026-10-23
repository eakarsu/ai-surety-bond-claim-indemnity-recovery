import test from "node:test";
import assert from "node:assert/strict";
import { filterRecords, recordsToCsv, fallbackAnalysis, labelledSections } from "../featurePack.mjs";
const rows=[{id:1,reference:"A-1",title:"Alpha rebate",status:"Open",risk:"High",amount:0,verified:false,note:""},{id:2,reference:"B-2",title:"Beta",status:"Closed",risk:"Low",amount:50,verified:true,note:"ok"}];
test("search/filter on main list",()=>{assert.equal(filterRecords(rows,{q:"alpha"}).length,1);assert.equal(filterRecords(rows,{status:"Closed"}).length,1);assert.equal(filterRecords(rows,{risk:"High"}).length,1);});
test("CSV export preserves 0/false",()=>{const csv=recordsToCsv(rows);assert.ok(csv.includes("A-1"));assert.ok(csv.split("\n")[1].includes(",0,"));});
test("fallback is labelled aiGenerated:false over own records",()=>{const r=fallbackAnalysis("Rebates",rows,"priorities");assert.equal(r.aiGenerated,false);assert.ok(r.sections.length>=2);assert.equal(r.metrics[0].value,"2");});
test("labelled sections preserve false/0/empty",()=>{const s=labelledSections(rows[0]);assert.equal(s.find(x=>x.label==="amount").value,"0");assert.equal(s.find(x=>x.label==="verified").value,"false");assert.equal(s.find(x=>x.label==="note").value,"—");});
