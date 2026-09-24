import assert from "node:assert/strict";
import test from "node:test";
import { leadActivitySchema, leadImportCommitSchema } from "./workValidators.js";

const id="507f1f77bcf86cd799439011";
const base={idempotencyKey:"550e8400-e29b-41d4-a716-446655440000",fileName:"expo.xlsx",fileHash:"a".repeat(64),mapping:{"Customer Name":"name","Stall No":"custom"},rows:[{rowNumber:2,values:{"Customer Name":"Acme","Stall No":"B-42"}}],task:{name:"Expo follow-up",project:id,assignedEmployee:id,priority:"HIGH",complexity:"MEDIUM",estimatedHours:4,deadline:"2026-09-30"}};
test("lead import validation preserves unknown source columns",()=>{const result=leadImportCommitSchema.safeParse({body:base});assert.equal(result.success,true);if(result.success)assert.equal(result.data.body.rows[0]?.values["Stall No"],"B-42");});
test("lead import accepts separate first and last name mappings",()=>{const result=leadImportCommitSchema.safeParse({body:{...base,mapping:{"First Name":"firstName","Last Name":"lastName","Mobile Number":"phone"},rows:[{rowNumber:2,values:{"First Name":"Rohan","Last Name":"Meher","Mobile Number":"+919827417472"}}]}});assert.equal(result.success,true);});
test("lead import rejects invalid idempotency and oversized cell values",()=>{const result=leadImportCommitSchema.safeParse({body:{...base,idempotencyKey:"retry",rows:[{rowNumber:2,values:{Name:"x".repeat(5001)}}]}});assert.equal(result.success,false);});
test("activity requires evidence and valid optimistic version",()=>{assert.equal(leadActivitySchema.safeParse({params:{id,workItemId:id},body:{interactionType:"PHONE_CALL",outcome:"CONNECTED",status:"CONNECTED",note:"Spoke about a demo",version:0}}).success,true);assert.equal(leadActivitySchema.safeParse({params:{id,workItemId:id},body:{interactionType:"PHONE_CALL",outcome:"CONNECTED",status:"CONNECTED",note:"",version:-1}}).success,false);});
