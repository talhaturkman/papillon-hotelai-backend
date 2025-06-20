import admin from 'firebase-admin';
import natural from 'natural';
import { NlpManager } from 'node-nlp';
import moment from 'moment';
import fs from 'fs/promises';
import path from 'path';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const nlpManager = new NlpManager({ languages: ['tr', 'en', 'de', 'ru'] });
const tokenizer = new natural.WordTokenizer();

async function generateGuestAnalytics() {
  const guestsRef = db.collection('guests');
  const snapshot = await guestsRef.get();
  
  const analytics = {
    totalGuests: snapshot.size,
    activeGuests: 0,
    returningGuests: 0,
    languagePreferences: {},
    popularPreferences: {},
    averageInteractionsPerDay: 0,
    peakHours: {},
    commonQueries: {},
    sentimentAnalysis: {
      positive: 0,
      neutral: 0,
      negative: 0
    }
  };

  let totalInteractions = 0;
  const last30Days = moment().subtract(30, 'days');

  for (const doc of snapshot.docs) {
    const guest = doc.data();
    
    // Active guests (interacted in last 30 days)
    if (moment(guest.lastLogin).isAfter(last30Days)) {
      analytics.activeGuests++;
    }

    // Language preferences
    if (guest.preferredLanguage) {
      analytics.languagePreferences[guest.preferredLanguage] = 
        (analytics.languagePreferences[guest.preferredLanguage] || 0) + 1;
    }

    // Guest preferences
    guest.preferences?.forEach(pref => {
      analytics.popularPreferences[pref] = 
        (analytics.popularPreferences[pref] || 0) + 1;
    });

    // Analyze interactions
    const interactionsRef = await db.collection(`guests/${doc.id}/interactions`).get();
    totalInteractions += interactionsRef.size;

    for (const interaction of interactionsRef.docs) {
      const data = interaction.data();
      
      // Peak hours analysis
      const hour = moment(data.timestamp).hour();
      analytics.peakHours[hour] = (analytics.peakHours[hour] || 0) + 1;

      // Query analysis
      const tokens = tokenizer.tokenize(data.message.toLowerCase());
      tokens.forEach(token => {
        if (token.length > 3) { // Ignore short words
          analytics.commonQueries[token] = 
            (analytics.commonQueries[token] || 0) + 1;
        }
      });

      // Basic sentiment analysis
      const sentiment = await analyzeSentiment(data.message, data.language);
      analytics.sentimentAnalysis[sentiment]++;
    }
  }

  // Calculate averages
  analytics.averageInteractionsPerDay = totalInteractions / 30;

  // Sort and limit results
  analytics.commonQueries = sortAndLimitObject(analytics.commonQueries, 20);
  analytics.popularPreferences = sortAndLimitObject(analytics.popularPreferences, 10);
  analytics.peakHours = sortAndLimitObject(analytics.peakHours, 24);

  return analytics;
}

async function generateServiceAnalytics() {
  const analytics = {
    popularServices: {},
    serviceUsageByTime: {},
    serviceUsageByLanguage: {},
    averageResponseTime: 0,
    successRate: 0
  };

  // Implementation similar to guest analytics
  // Add specific service-related metrics

  return analytics;
}

async function generateMarketingInsights() {
  const insights = {
    targetSegments: [],
    recommendedPromotions: [],
    crossSellingOpportunities: [],
    guestRetentionMetrics: {
      returnRate: 0,
      averageStaysBetweenVisits: 0,
      loyaltyScore: 0
    }
  };

  // Implementation for marketing insights
  // Add specific marketing-related metrics

  return insights;
}

async function analyzeSentiment(text, language) {
  // Basic sentiment analysis using node-nlp
  const result = await nlpManager.process(language, text);
  
  if (result.sentiment.score > 0.2) return 'positive';
  if (result.sentiment.score < -0.2) return 'negative';
  return 'neutral';
}

function sortAndLimitObject(obj, limit) {
  return Object.fromEntries(
    Object.entries(obj)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
  );
}

async function generateAndSaveReports() {
  try {
    const timestamp = moment().format('YYYY-MM-DD_HH-mm');
    const reportsDir = path.join(process.cwd(), 'reports');
    
    // Ensure reports directory exists
    await fs.mkdir(reportsDir, { recursive: true });

    // Generate all reports
    const [guestAnalytics, serviceAnalytics, marketingInsights] = await Promise.all([
      generateGuestAnalytics(),
      generateServiceAnalytics(),
      generateMarketingInsights()
    ]);

    // Combine all analytics
    const fullReport = {
      timestamp,
      guestAnalytics,
      serviceAnalytics,
      marketingInsights
    };

    // Save report
    await fs.writeFile(
      path.join(reportsDir, `analytics_${timestamp}.json`),
      JSON.stringify(fullReport, null, 2)
    );

    // Save to Firebase for historical tracking
    await db.collection('analytics').doc(timestamp).set(fullReport);

    console.log(`Analytics report generated successfully: analytics_${timestamp}.json`);
    return fullReport;
  } catch (error) {
    console.error('Error generating analytics report:', error);
    throw error;
  }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateAndSaveReports()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

export {
  generateGuestAnalytics,
  generateServiceAnalytics,
  generateMarketingInsights,
  generateAndSaveReports
}; 