const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const orttoService = require('../services/orttoService');
const { logger } = require('../utils/logger');

// Analyze email content
router.post('/analyze-email', async (req, res) => {
  try {
    const { subject_line, preview_text, email_content, target_audience, campaign_type } = req.body;

    // Validate required fields
    if (!subject_line || !email_content) {
      return res.status(400).json({ 
        error: 'Subject line and email content are required' 
      });
    }

    logger.info('Analyzing email content:', {
      subject_line: subject_line.substring(0, 50) + '...',
      target_audience,
      campaign_type
    });

    const analysis = await aiService.analyzeEmail({
      subject_line,
      preview_text: preview_text || '',
      email_content,
      target_audience: target_audience || 'general',
      campaign_type: campaign_type || 'newsletter'
    });

    res.json(analysis);
  } catch (error) {
    logger.error('Error in analyze-email endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to analyze email',
      message: error.message 
    });
  }
});

// Generate email copy
router.post('/generate-copy', async (req, res) => {
  try {
    const { 
      campaign_purpose, 
      product_service, 
      target_audience, 
      category, 
      tone, 
      call_to_action, 
      special_offers, 
      additional_notes 
    } = req.body;

    // Validate required fields
    if (!campaign_purpose || !product_service) {
      return res.status(400).json({ 
        error: 'Campaign purpose and product/service are required' 
      });
    }

    logger.info('Generating email copy:', {
      campaign_purpose: campaign_purpose.substring(0, 50) + '...',
      product_service: product_service.substring(0, 50) + '...',
      target_audience,
      category,
      tone
    });

    const copy = await aiService.generateEmailCopy({
      campaign_purpose,
      product_service,
      target_audience: target_audience || 'general',
      category: category || 'newsletter',
      tone: tone || 'professional',
      call_to_action: call_to_action || '',
      special_offers: special_offers || '',
      additional_notes: additional_notes || ''
    });

    res.json(copy);
  } catch (error) {
    logger.error('Error in generate-copy endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate email copy',
      message: error.message 
    });
  }
});

// Generate blog copy
router.post('/generate-blog-copy', async (req, res) => {
  try {
    const { 
      campaign_purpose, 
      product_service, 
      target_audience, 
      category, 
      tone, 
      call_to_action, 
      special_offers, 
      additional_notes 
    } = req.body;

    // Validate required fields
    if (!campaign_purpose || !product_service) {
      return res.status(400).json({ 
        error: 'Campaign purpose and product/service are required' 
      });
    }

    logger.info('Generating blog copy:', {
      campaign_purpose: campaign_purpose.substring(0, 50) + '...',
      product_service: product_service.substring(0, 50) + '...',
      target_audience,
      category,
      tone
    });

    const blogCopy = await aiService.generateBlogCopy({
      campaign_purpose,
      product_service,
      target_audience: target_audience || 'general',
      category: category || 'newsletter',
      tone: tone || 'professional',
      call_to_action: call_to_action || '',
      special_offers: special_offers || '',
      additional_notes: additional_notes || ''
    });

    res.json(blogCopy);
  } catch (error) {
    logger.error('Error in generate-blog-copy endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate blog copy',
      message: error.message 
    });
  }
});

// Generate social media post
router.post('/generate-social-media-post', async (req, res) => {
  try {
    const { 
      campaign_purpose, 
      product_service, 
      target_audience, 
      category, 
      tone, 
      call_to_action, 
      special_offers, 
      additional_notes 
    } = req.body;

    // Validate required fields
    if (!campaign_purpose || !product_service) {
      return res.status(400).json({ 
        error: 'Campaign purpose and product/service are required' 
      });
    }

    logger.info('Generating social media post:', {
      campaign_purpose: campaign_purpose.substring(0, 50) + '...',
      product_service: product_service.substring(0, 50) + '...',
      target_audience,
      category,
      tone
    });

    const socialMediaPost = await aiService.generateSocialMediaPost({
      campaign_purpose,
      product_service,
      target_audience: target_audience || 'general',
      category: category || 'newsletter',
      tone: tone || 'professional',
      call_to_action: call_to_action || '',
      special_offers: special_offers || '',
      additional_notes: additional_notes || ''
    });

    res.json(socialMediaPost);
  } catch (error) {
    logger.error('Error in generate-social-media-post endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate social media post',
      message: error.message 
    });
  }
});

// Predict email performance
router.post('/predict-performance', async (req, res) => {
  try {
    const { subject_line, preview_text, email_content, target_audience, campaign_type, use_historical_data } = req.body;

    // Validate required fields
    if (!subject_line || !email_content) {
      return res.status(400).json({ 
        error: 'Subject line and email content are required' 
      });
    }

    logger.info('Predicting email performance:', {
      subject_line: subject_line.substring(0, 50) + '...',
      target_audience,
      campaign_type,
      use_historical_data
    });

    let historicalData = null;
    
    // If user wants to use historical data, fetch it from Ortto
    if (use_historical_data) {
      try {
        const savedCampaignIds = req.body.campaign_ids || [];
        if (savedCampaignIds.length > 0) {
          const historicalReports = await Promise.all(
            savedCampaignIds.map(async (campaignId) => {
              try {
                return await orttoService.fetchReport(campaignId);
              } catch (error) {
                logger.warn(`Failed to fetch historical data for campaign ${campaignId}:`, error.message);
                return null;
              }
            })
          );
          
          historicalData = historicalReports.filter(report => report !== null);
        }
      } catch (error) {
        logger.warn('Failed to fetch historical data, proceeding without it:', error.message);
      }
    }

    const predictions = await aiService.predictPerformance({
      subject_line,
      preview_text: preview_text || '',
      email_content,
      target_audience: target_audience || 'general',
      campaign_type: campaign_type || 'newsletter'
    }, historicalData);

    res.json(predictions);
  } catch (error) {
    logger.error('Error in predict-performance endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to predict performance',
      message: error.message 
    });
  }
});

// Generate optimization suggestions
router.post('/generate-suggestions', async (req, res) => {
  try {
    const { analysis, email_data } = req.body;

    // Validate required fields
    if (!analysis || !email_data) {
      return res.status(400).json({ 
        error: 'Analysis and email data are required' 
      });
    }

    logger.info('Generating optimization suggestions');

    const suggestions = await aiService.generateSuggestions(analysis, email_data);

    res.json(suggestions);
  } catch (error) {
    logger.error('Error in generate-suggestions endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate suggestions',
      message: error.message 
    });
  }
});

// Generate email ideas
router.post('/generate-ideas', async (req, res) => {
  try {
    const { campaign_type, audience, goals } = req.body;

    // Validate required fields
    if (!campaign_type || !audience || !goals) {
      return res.status(400).json({ 
        error: 'Campaign type, audience, and goals are required' 
      });
    }

    logger.info('Generating email ideas:', {
      campaign_type,
      audience,
      goals
    });

    const ideas = await aiService.generateEmailIdeas(campaign_type, audience, goals);

    res.json(ideas);
  } catch (error) {
    logger.error('Error in generate-ideas endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate email ideas',
      message: error.message 
    });
  }
});

// Get industry benchmarks
router.get('/benchmarks', async (req, res) => {
  try {
    const { industry } = req.query;
    
    logger.info('Getting benchmarks for industry:', industry || 'general');

    const benchmarks = await aiService.getBenchmarks(industry || 'general');

    res.json(benchmarks);
  } catch (error) {
    logger.error('Error in benchmarks endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve benchmarks',
      message: error.message 
    });
  }
});

// Comprehensive email analysis (combines all services)
router.post('/comprehensive-analysis', async (req, res) => {
  try {
    const { 
      subject_line, 
      preview_text, 
      email_content, 
      target_audience, 
      campaign_type,
      use_historical_data,
      campaign_ids 
    } = req.body;

    // Validate required fields
    if (!subject_line || !email_content) {
      return res.status(400).json({ 
        error: 'Subject line and email content are required' 
      });
    }

    logger.info('Starting comprehensive email analysis');

    const emailData = {
      subject_line,
      preview_text: preview_text || '',
      email_content,
      target_audience: target_audience || 'general',
      campaign_type: campaign_type || 'newsletter'
    };

    // Step 1: Analyze email content
    const analysis = await aiService.analyzeEmail(emailData);

    // Step 2: Predict performance
    let historicalData = null;
    if (use_historical_data && campaign_ids && campaign_ids.length > 0) {
      try {
        const historicalReports = await Promise.all(
          campaign_ids.map(async (campaignId) => {
            try {
              return await orttoService.fetchReport(campaignId);
            } catch (error) {
              logger.warn(`Failed to fetch historical data for campaign ${campaignId}:`, error.message);
              return null;
            }
          })
        );
        historicalData = historicalReports.filter(report => report !== null);
      } catch (error) {
        logger.warn('Failed to fetch historical data:', error.message);
      }
    }

    const predictions = await aiService.predictPerformance(emailData, historicalData);

    // Step 3: Generate suggestions
    const suggestions = await aiService.generateSuggestions(analysis, emailData);

    // Step 4: Get benchmarks
    const benchmarks = await aiService.getBenchmarks(target_audience || 'general');

    const comprehensiveResult = {
      analysis,
      predictions,
      suggestions,
      benchmarks,
      timestamp: new Date().toISOString()
    };

    logger.info('Comprehensive analysis completed successfully');

    res.json(comprehensiveResult);
  } catch (error) {
    logger.error('Error in comprehensive-analysis endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to perform comprehensive analysis',
      message: error.message 
    });
  }
});

// Generate send time recommendations
router.post('/send-time-recommendations', async (req, res) => {
  try {
    const { historical_data, audience_segment } = req.body;

    // Validate required fields
    if (!historical_data) {
      return res.status(400).json({ 
        error: 'Historical data is required' 
      });
    }

    logger.info('Generating send time recommendations:', {
      audienceSegment: audience_segment || 'general',
      dataPoints: historical_data.length || 0
    });

    const recommendations = await aiService.generateSendTimeRecommendations(
      historical_data,
      audience_segment || 'general'
    );

    res.json(recommendations);
  } catch (error) {
    logger.error('Error in send-time-recommendations endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate send time recommendations',
      message: error.message 
    });
  }
});

// Generate content calendar
router.post('/content-calendar', async (req, res) => {
  try {
    const { campaign_goals, industry, timeframe } = req.body;

    // Validate required fields
    if (!campaign_goals || !industry) {
      return res.status(400).json({ 
        error: 'Campaign goals and industry are required' 
      });
    }

    logger.info('Generating content calendar:', {
      industry,
      timeframe: timeframe || '90',
      goals: campaign_goals.substring(0, 50) + '...'
    });

    const calendar = await aiService.generateContentCalendar(
      campaign_goals,
      industry,
      timeframe || '90'
    );

    res.json(calendar);
  } catch (error) {
    logger.error('Error in content-calendar endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate content calendar',
      message: error.message 
    });
  }
});

// Generate A/B test suggestions
router.post('/ab-test-suggestions', async (req, res) => {
  try {
    const { campaign_data, historical_performance } = req.body;

    // Validate required fields
    if (!campaign_data) {
      return res.status(400).json({ 
        error: 'Campaign data is required' 
      });
    }

    logger.info('Generating A/B test suggestions:', {
      hasHistoricalData: !!historical_performance,
      campaignType: campaign_data.campaign_type || 'unknown'
    });

    const suggestions = await aiService.generateABTestSuggestions(
      campaign_data,
      historical_performance || {}
    );

    res.json(suggestions);
  } catch (error) {
    logger.error('Error in ab-test-suggestions endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate A/B test suggestions',
      message: error.message 
    });
  }
});

// Detect performance anomalies
router.post('/performance-anomalies', async (req, res) => {
  try {
    const { campaign_data, historical_baseline } = req.body;

    // Validate required fields
    if (!campaign_data) {
      return res.status(400).json({ 
        error: 'Campaign data is required' 
      });
    }

    logger.info('Detecting performance anomalies:', {
      hasBaseline: !!historical_baseline,
      metrics: Object.keys(campaign_data.performance || {})
    });

    const anomalies = await aiService.detectPerformanceAnomalies(
      campaign_data,
      historical_baseline || {}
    );

    res.json(anomalies);
  } catch (error) {
    logger.error('Error in performance-anomalies endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to detect performance anomalies',
      message: error.message 
    });
  }
});

// Generate campaign sequence
router.post('/campaign-sequence', async (req, res) => {
  try {
    const { campaign_goals, audience_data, product_info } = req.body;

    // Validate required fields
    if (!campaign_goals || !audience_data || !product_info) {
      return res.status(400).json({ 
        error: 'Campaign goals, audience data, and product info are required' 
      });
    }

    logger.info('Generating campaign sequence:', {
      campaign_goals: campaign_goals.substring(0, 50) + '...',
      audience_size: audience_data.size
    });

    const sequence = await aiService.generateCampaignSequence(
      campaign_goals,
      audience_data,
      product_info
    );

    res.json(sequence);
  } catch (error) {
    logger.error('Error in campaign-sequence endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate campaign sequence',
      message: error.message 
    });
  }
});

// Audience Intelligence Routes

// Predictive segmentation
router.post('/predict-segments', async (req, res) => {
  try {
    const { subscriber_data, historical_behavior } = req.body;

    // Validate required fields
    if (!subscriber_data) {
      return res.status(400).json({ 
        error: 'Subscriber data is required' 
      });
    }

    logger.info('Predicting segments for subscriber data');

    const segments = await aiService.predictSegments(
      subscriber_data,
      historical_behavior || {}
    );

    res.json(segments);
  } catch (error) {
    logger.error('Error in predict-segments endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to predict segments',
      message: error.message 
    });
  }
});

// Churn prediction
router.post('/predict-churn', async (req, res) => {
  try {
    const { subscriber_data, engagement_history, purchase_history } = req.body;

    // Validate required fields
    if (!subscriber_data) {
      return res.status(400).json({ 
        error: 'Subscriber data is required' 
      });
    }

    logger.info('Predicting churn for subscribers');

    const predictions = await aiService.predictChurn(
      subscriber_data,
      engagement_history || {},
      purchase_history || {}
    );

    res.json(predictions);
  } catch (error) {
    logger.error('Error in predict-churn endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to predict churn',
      message: error.message 
    });
  }
});

// Engagement scoring
router.post('/calculate-engagement', async (req, res) => {
  try {
    const { subscriber_data, recent_activity } = req.body;

    // Validate required fields
    if (!subscriber_data) {
      return res.status(400).json({ 
        error: 'Subscriber data is required' 
      });
    }

    logger.info('Calculating engagement scores');

    const scores = await aiService.calculateEngagementScore(
      subscriber_data,
      recent_activity || {}
    );

    res.json(scores);
  } catch (error) {
    logger.error('Error in calculate-engagement endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to calculate engagement scores',
      message: error.message 
    });
  }
});

// Persona development
router.post('/develop-personas', async (req, res) => {
  try {
    const { subscriber_data, behavior_patterns, demographics } = req.body;

    // Validate required fields
    if (!subscriber_data) {
      return res.status(400).json({ 
        error: 'Subscriber data is required' 
      });
    }

    logger.info('Developing buyer personas');

    const personas = await aiService.developPersonas(
      subscriber_data,
      behavior_patterns || {},
      demographics || {}
    );

    res.json(personas);
  } catch (error) {
    logger.error('Error in develop-personas endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to develop personas',
      message: error.message 
    });
  }
});

// Advanced Analytics Routes

// Performance anomaly detection
router.post('/detect-anomalies', async (req, res) => {
  try {
    const { performance_data, historical_baseline } = req.body;

    // Validate required fields
    if (!performance_data) {
      return res.status(400).json({ 
        error: 'Performance data is required' 
      });
    }

    logger.info('Detecting performance anomalies');

    const anomalies = await aiService.detectAnomalies(
      performance_data,
      historical_baseline || {}
    );

    res.json(anomalies);
  } catch (error) {
    logger.error('Error in detect-anomalies endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to detect anomalies',
      message: error.message 
    });
  }
});

// ROI prediction
router.post('/predict-roi', async (req, res) => {
  try {
    const { campaign_data, historical_roi, audience_data } = req.body;

    // Validate required fields
    if (!campaign_data) {
      return res.status(400).json({ 
        error: 'Campaign data is required' 
      });
    }

    logger.info('Predicting campaign ROI');

    const prediction = await aiService.predictROI(
      campaign_data,
      historical_roi || {},
      audience_data || {}
    );

    res.json(prediction);
  } catch (error) {
    logger.error('Error in predict-roi endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to predict ROI',
      message: error.message 
    });
  }
});

// A/B test optimization
router.post('/optimize-ab-tests', async (req, res) => {
  try {
    const { campaign_data, historical_tests } = req.body;

    // Validate required fields
    if (!campaign_data) {
      return res.status(400).json({ 
        error: 'Campaign data is required' 
      });
    }

    logger.info('Optimizing A/B tests');

    const suggestions = await aiService.optimizeABTests(
      campaign_data,
      historical_tests || {}
    );

    res.json(suggestions);
  } catch (error) {
    logger.error('Error in optimize-ab-tests endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to optimize A/B tests',
      message: error.message 
    });
  }
});

// Seasonal trend analysis
router.post('/analyze-seasonal-trends', async (req, res) => {
  try {
    const { historical_data, time_range } = req.body;

    // Validate required fields
    if (!historical_data) {
      return res.status(400).json({ 
        error: 'Historical data is required' 
      });
    }

    logger.info('Analyzing seasonal trends');

    const trends = await aiService.analyzeSeasonalTrends(
      historical_data,
      time_range || '12 months'
    );

    res.json(trends);
  } catch (error) {
    logger.error('Error in analyze-seasonal-trends endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to analyze seasonal trends',
      message: error.message 
    });
  }
});

// Smart Recommendations Routes

// Subject line A/B testing
router.post('/generate-subject-line-tests', async (req, res) => {
  try {
    const { campaign_data, historical_performance } = req.body;

    // Validate required fields
    if (!campaign_data) {
      return res.status(400).json({ 
        error: 'Campaign data is required' 
      });
    }

    logger.info('Generating subject line A/B tests');

    const tests = await aiService.generateSubjectLineABTests(
      campaign_data,
      historical_performance || {}
    );

    res.json(tests);
  } catch (error) {
    logger.error('Error in generate-subject-line-tests endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate A/B tests',
      message: error.message 
    });
  }
});

// Email content optimization
router.post('/optimize-email-content', async (req, res) => {
  try {
    const { email_content, target_audience, campaign_goals } = req.body;

    // Validate required fields
    if (!email_content) {
      return res.status(400).json({ 
        error: 'Email content is required' 
      });
    }

    logger.info('Optimizing email content');

    const optimization = await aiService.optimizeEmailContent(
      email_content,
      target_audience || 'general',
      campaign_goals || ''
    );

    res.json(optimization);
  } catch (error) {
    logger.error('Error in optimize-email-content endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to optimize email content',
      message: error.message 
    });
  }
});

// Image recommendations
router.post('/recommend-images', async (req, res) => {
  try {
    const { campaign_theme, target_audience, content_type } = req.body;

    // Validate required fields
    if (!campaign_theme) {
      return res.status(400).json({ 
        error: 'Campaign theme is required' 
      });
    }

    logger.info('Recommending images for campaign');

    const recommendations = await aiService.recommendImages(
      campaign_theme,
      target_audience || 'general',
      content_type || 'email'
    );

    res.json(recommendations);
  } catch (error) {
    logger.error('Error in recommend-images endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to recommend images',
      message: error.message 
    });
  }
});

// CTA optimization
router.post('/optimize-cta', async (req, res) => {
  try {
    const { cta_data, conversion_goals } = req.body;

    // Validate required fields
    if (!cta_data) {
      return res.status(400).json({ 
        error: 'CTA data is required' 
      });
    }

    logger.info('Optimizing call-to-action');

    const optimizations = await aiService.optimizeCTA(
      cta_data,
      conversion_goals || ''
    );

    res.json(optimizations);
  } catch (error) {
    logger.error('Error in optimize-cta endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to optimize CTA',
      message: error.message 
    });
  }
});

// Visual Content Generation Routes

// Email template generation
router.post('/generate-email-template', async (req, res) => {
  try {
    const { brand_data, campaign_type } = req.body;

    // Validate required fields
    if (!brand_data) {
      return res.status(400).json({ 
        error: 'Brand data is required' 
      });
    }

    logger.info('Generating email template');

    const template = await aiService.generateEmailTemplate(
      brand_data,
      campaign_type || 'newsletter'
    );

    res.json(template);
  } catch (error) {
    logger.error('Error in generate-email-template endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate email template',
      message: error.message 
    });
  }
});

// Infographic creation
router.post('/create-infographic', async (req, res) => {
  try {
    const { data, theme, target_audience } = req.body;

    // Validate required fields
    if (!data) {
      return res.status(400).json({ 
        error: 'Data is required' 
      });
    }

    logger.info('Creating infographic design');

    const infographic = await aiService.createInfographic(
      data,
      theme || 'professional',
      target_audience || 'general'
    );

    res.json(infographic);
  } catch (error) {
    logger.error('Error in create-infographic endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to create infographic',
      message: error.message 
    });
  }
});

// Video script generation
router.post('/generate-video-script', async (req, res) => {
  try {
    const { video_type, target_audience, key_message } = req.body;

    // Validate required fields
    if (!video_type || !key_message) {
      return res.status(400).json({ 
        error: 'Video type and key message are required' 
      });
    }

    logger.info('Generating video script');

    const script = await aiService.generateVideoScript(
      video_type,
      target_audience || 'general',
      key_message
    );

    res.json(script);
  } catch (error) {
    logger.error('Error in generate-video-script endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate video script',
      message: error.message 
    });
  }
});

// Landing page copy generation
router.post('/generate-landing-page', async (req, res) => {
  try {
    const { 
      product_service, 
      target_audience, 
      page_type, 
      key_benefits, 
      testimonials, 
      pricing_info,
      conversion_goals 
    } = req.body;

    // Validate required fields
    if (!product_service || !target_audience || !page_type) {
      return res.status(400).json({ 
        error: 'Product/service, target audience, and page type are required' 
      });
    }

    logger.info('Generating landing page copy:', {
      product_service: product_service.substring(0, 50) + '...',
      target_audience,
      page_type
    });

    const landingPageCopy = await aiService.generateLandingPageCopy({
      product_service,
      target_audience,
      page_type,
      key_benefits: key_benefits || '',
      testimonials: testimonials || '',
      pricing_info: pricing_info || ''
    }, conversion_goals || 'general');

    res.json(landingPageCopy);
  } catch (error) {
    logger.error('Error in generate-landing-page endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate landing page copy',
      message: error.message 
    });
  }
});

// Create AI Blog Post
router.post('/create-blog-post', async (req, res) => {
  try {
    const { 
      topic, 
      target_audience, 
      blog_type, 
      tone, 
      length, 
      include_images, 
      seo_focus,
      call_to_action,
      additional_requirements 
    } = req.body;

    // Validate required fields
    if (!topic || !target_audience || !blog_type) {
      return res.status(400).json({ 
        error: 'Topic, target audience, and blog type are required' 
      });
    }

    logger.info('Creating AI blog post:', {
      topic: topic.substring(0, 50) + '...',
      target_audience,
      blog_type,
      tone,
      length
    });

    const blogPost = await aiService.createBlogPost({
      topic,
      target_audience,
      blog_type: blog_type || 'informational',
      tone: tone || 'professional',
      length: length || 'medium',
      include_images: include_images || false,
      seo_focus: seo_focus || 'general',
      call_to_action: call_to_action || '',
      additional_requirements: additional_requirements || ''
    });

    res.json(blogPost);
  } catch (error) {
    logger.error('Error in create-blog-post endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to create blog post',
      message: error.message 
    });
  }
});

// Publish blog post to Shopify
router.post('/publish-to-shopify', async (req, res) => {
  try {
    const { blog_post, shopify_credentials } = req.body;

    // Validate required fields
    if (!blog_post || !shopify_credentials) {
      return res.status(400).json({ 
        error: 'Blog post data and Shopify credentials are required' 
      });
    }

    const { shop_domain, access_token } = shopify_credentials;

    if (!shop_domain || !access_token) {
      return res.status(400).json({ 
        error: 'Shop domain and access token are required' 
      });
    }

    logger.info('Publishing blog post to Shopify:', {
      shop_domain,
      title: blog_post.blog_post?.title?.substring(0, 50) + '...'
    });

    const publishResult = await aiService.publishToShopify(blog_post, {
      shop_domain,
      access_token
    });

    res.json(publishResult);
  } catch (error) {
    logger.error('Error in publish-to-shopify endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to publish to Shopify',
      message: error.message 
    });
  }
});

// Download blog post files
router.post('/download-blog-files', async (req, res) => {
  try {
    const { blog_post } = req.body;

    if (!blog_post) {
      return res.status(400).json({ 
        error: 'Blog post data is required' 
      });
    }

    logger.info('Generating downloadable files for blog post:', {
      title: blog_post.blog_post?.title?.substring(0, 50) + '...'
    });

    // Create HTML file content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${blog_post.blog_post?.meta_title || blog_post.blog_post?.title}</title>
    <meta name="description" content="${blog_post.blog_post?.meta_description}">
    <meta name="keywords" content="${blog_post.blog_post?.tags?.join(', ')}">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        h3 { color: #666; }
        p { margin-bottom: 15px; }
        ul, ol { margin-bottom: 15px; }
        .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .tags { margin-top: 20px; }
        .tag { background: #007cba; color: white; padding: 5px 10px; border-radius: 15px; margin-right: 5px; font-size: 12px; }
    </style>
</head>
<body>
    <article>
        <header>
            <h1>${blog_post.blog_post?.title}</h1>
            <div class="meta">
                <p><strong>Author:</strong> ${blog_post.blog_post?.author}</p>
                <p><strong>Published:</strong> ${blog_post.blog_post?.published_date}</p>
                <p><strong>Read Time:</strong> ${blog_post.blog_post?.estimated_read_time}</p>
                <p><strong>Category:</strong> ${blog_post.blog_post?.category}</p>
            </div>
        </header>
        
        <div class="content">
            ${blog_post.blog_post?.content}
        </div>
        
        <footer>
            <div class="tags">
                ${blog_post.blog_post?.tags?.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </footer>
    </article>
</body>
</html>`;

    // Create metadata JSON file
    const metadataJson = JSON.stringify({
      blog_post: blog_post.blog_post,
      shopify_metadata: blog_post.shopify_metadata,
      generated_at: new Date().toISOString(),
      instructions: "Import this JSON file into your Shopify admin or use the HTML file for manual publishing"
    }, null, 2);

    res.json({
      success: true,
      files: {
        html_content: htmlContent,
        metadata_json: metadataJson,
        filename: blog_post.blog_post?.slug || 'blog-post'
      },
      message: 'Downloadable files generated successfully'
    });
  } catch (error) {
    logger.error('Error in download-blog-files endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to generate downloadable files',
      message: error.message 
    });
  }
});

module.exports = router; 