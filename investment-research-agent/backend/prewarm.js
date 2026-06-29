import dotenv from 'dotenv';
import { compileGraph } from './graph/index.js';
import { setCache } from './services/cache.js';

dotenv.config();

const companies = [
  'Tesla',
  'Apple',
  'Nvidia',
  'Microsoft',
  'Amazon',
  'Reliance Industries'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const graph = compileGraph();
  console.log('Starting cache pre-warm sequence...');
  
  for (const company of companies) {
    console.log(`\n========================================`);
    console.log(`Pre-warming cache for: ${company}`);
    console.log(`========================================`);
    
    try {
      const stream = await graph.stream(
        { companyName: company },
        { streamMode: "updates" }
      );
      
      let finalAccumulatedState = {};
      
      for await (const chunk of stream) {
        const nodeName = Object.keys(chunk)[0];
        const stateUpdate = chunk[nodeName];
        console.log(`[${company}] Completed node: ${nodeName}`);
        
        Object.assign(finalAccumulatedState, stateUpdate);
      }
      
      if (finalAccumulatedState.finalDecision) {
        const cacheKey = company.trim().toLowerCase();
        setCache(cacheKey, finalAccumulatedState);
        console.log(`✅ Successfully cached ${company}`);
      } else {
        console.log(`❌ Failed to generate final decision for ${company}`);
      }
    } catch (error) {
      console.error(`💥 Error processing ${company}:`, error);
    }
    
    console.log(`Waiting 20 seconds before next company to avoid rate limits...`);
    await sleep(20000);
  }
  
  console.log('\n✅ Pre-warm sequence complete!');
  process.exit(0);
}

run();
