import express from 'express';
import { askRAG } from '../services/ragService.js';

const router = express.Router();

export const TEST_SUITE = [
  {
    id: 1,
    query: 'What is the price of Maple Residency?',
    category: 'Factual Retrieval',
    expectedKeywords: ['42,000,000', 'Maple Residency'],
    expectedDocument: 'Property_Listings.pdf',
    hallucinationExpected: false,
  },
  {
    id: 2,
    query: 'How many bedrooms does Cedar Heights have?',
    category: 'Factual Retrieval',
    expectedKeywords: ['4', 'bedroom', 'Cedar Heights'],
    expectedDocument: 'Property_Listings.pdf',
    hallucinationExpected: false,
  },
  {
    id: 3,
    query: 'What is the sales commission charged by Northstar Estates?',
    category: 'Policy Retrieval',
    expectedKeywords: ['2%', 'commission'],
    expectedDocument: 'Services_and_Fees.pdf',
    hallucinationExpected: false,
  },
  {
    id: 4,
    query: 'What is the property viewing policy?',
    category: 'Policy Retrieval',
    expectedKeywords: ['24 hours', 'viewing'],
    expectedDocument: 'FAQs.pdf',
    hallucinationExpected: false,
  },
  {
    id: 5,
    query: 'What documents are required for a property purchase?',
    category: 'Complex Extraction',
    expectedKeywords: ['CNIC', 'photograph', 'Funds', 'NTN'],
    expectedDocument: 'FAQs.pdf',
    hallucinationExpected: false,
  },
  {
    id: 6,
    query: 'Which properties are located in Islamabad and priced below PKR 50 million?',
    category: 'Multi-Entity Filtering',
    expectedKeywords: ['Maple Residency', 'Cedar Heights', 'Lakeview'],
    expectedDocument: 'Property_Listings.pdf',
    hallucinationExpected: false,
  },
  {
    id: 7,
    query: 'What is the sales commission amount for Maple Residency?',
    category: 'Cross-Document Reasoning',
    expectedKeywords: ['840,000', '2%', '42,000,000'],
    expectedDocument: 'Property_Listings.pdf', // and Services_and_Fees.pdf
    hallucinationExpected: false,
  },
  {
    id: 8,
    query: 'Compare Maple Residency and Cedar Heights in terms of bedrooms, price, and location.',
    category: 'Comparative Analysis',
    expectedKeywords: ['Maple', 'Cedar', 'F-11', 'E-11', '42,000,000', '46,500,000'],
    expectedDocument: 'Property_Listings.pdf',
    hallucinationExpected: false,
  },
  {
    id: 9,
    query: 'What is the reservation deposit policy?',
    category: 'Policy Retrieval',
    expectedKeywords: ['5%', '14', 'deposit', 'refundable'],
    expectedDocument: 'Policies_and_Terms.pdf',
    hallucinationExpected: false,
  },
  {
    id: 10,
    query: "What was Northstar Estates' total revenue in 2025?",
    category: 'Hallucination Resistance',
    expectedKeywords: ["couldn't find", "not found", "not disclosed"],
    expectedDocument: null,
    hallucinationExpected: true,
  },
  {
    id: 11,
    query: 'Who founded Northstar Estates?',
    category: 'Hallucination Resistance',
    expectedKeywords: ["couldn't find", "not found", "not mentioned"],
    expectedDocument: null,
    hallucinationExpected: true,
  },
  {
    id: 12,
    query: 'Which university did the founder attend?',
    category: 'Hallucination Resistance',
    expectedKeywords: ["couldn't find", "not found", "not mentioned"],
    expectedDocument: null,
    hallucinationExpected: true,
  },
  {
    id: 13,
    query: 'What is the price of Pine Villas?',
    category: 'Factual Retrieval',
    expectedKeywords: ['62,000,000', 'Pine Villas'],
    expectedDocument: 'Property_Listings.pdf',
    hallucinationExpected: false,
  },
  {
    id: 14,
    query: 'Which property is the most expensive in the portfolio?',
    category: 'Analytical Ranking',
    expectedKeywords: ['Pine Villas', '62,000,000'],
    expectedDocument: 'Property_Listings.pdf',
    hallucinationExpected: false,
  },
  {
    id: 15,
    query: 'What services does Northstar Estates provide?',
    category: 'Comprehensive Synthesis',
    expectedKeywords: ['Buyer', 'Seller', 'conveyance', 'valuation'],
    expectedDocument: 'Services_and_Fees.pdf',
    hallucinationExpected: false,
  },
];

// GET /api/evaluation/tests
router.get('/tests', (req, res) => {
  res.json(TEST_SUITE);
});

// POST /api/evaluation/run
router.post('/run', async (req, res) => {
  try {
    const results = [];
    const testSessionId = 'test_eval_session';

    for (const test of TEST_SUITE) {
      const startTime = Date.now();
      const output = await askRAG({
        sessionId: testSessionId,
        question: test.query,
        topK: 5,
      });
      const latency = Date.now() - startTime;
      const answer = output.assistantMessage.content;
      const sources = output.assistantMessage.sources || [];

      let passed = true;
      const checks = [];

      if (test.hallucinationExpected) {
        const refused =
          answer.toLowerCase().includes("couldn't find") ||
          answer.toLowerCase().includes("not found") ||
          answer.toLowerCase().includes("not mentioned") ||
          answer.toLowerCase().includes("not disclosed");
        passed = refused && sources.length === 0;
        checks.push(`Refusal verified: ${refused ? 'YES' : 'NO'}`);
        checks.push(`Zero hallucinated sources: ${sources.length === 0 ? 'YES' : 'NO'}`);
      } else {
        // Keyword checks
        for (const kw of test.expectedKeywords) {
          const match = answer.toLowerCase().includes(kw.toLowerCase());
          checks.push(`Keyword "${kw}": ${match ? 'FOUND' : 'MISSING'}`);
          if (!match) passed = false;
        }

        // Check if expected document was cited
        if (test.expectedDocument) {
          const cited = sources.some((s) => s.document_name.toLowerCase().includes(test.expectedDocument.toLowerCase().replace('.pdf', '')));
          checks.push(`Cited ${test.expectedDocument}: ${cited ? 'YES' : 'NO'}`);
          if (!cited) passed = false;
        }
      }

      results.push({
        id: test.id,
        query: test.query,
        category: test.category,
        passed,
        latencyMs: latency,
        answer,
        sourcesCount: sources.length,
        sources: sources.map((s) => ({
          doc: s.document_name,
          page: s.page_number,
          score: s.similarity_score,
        })),
        checks,
      });

      // Brief delay to prevent bursting API rate limits across 15 tests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const totalPassed = results.filter((r) => r.passed).length;
    const accuracy = Math.round((totalPassed / results.length) * 100);

    res.json({
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      totalPassed,
      accuracyPercentage: accuracy,
      results,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
