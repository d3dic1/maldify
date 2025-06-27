const { GoogleGenerativeAI } = require('@google/generative-ai');
const { logger } = require('../utils/logger');

class AIService {
  constructor() {
    // Initialize Google Gemini
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    logger.info('AI Service initialized with Google Gemini');
  }

  // Helper function to extract JSON from AI response
  extractJSONFromResponse(text) {
    try {
      // First, try to parse as-is
      return JSON.parse(text);
    } catch (error) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (e) {
          logger.error('Failed to parse JSON from code block:', e);
        }
      }
      
      // If that fails, try to extract JSON from the text
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        try {
          const jsonText = text.substring(jsonStart, jsonEnd + 1);
          // Remove any JavaScript-style comments that might be in the JSON
          const cleanedJson = jsonText.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
          return JSON.parse(cleanedJson);
        } catch (e) {
          logger.error('Failed to parse extracted JSON:', e);
        }
      }
      
      // If all else fails, return a default response
      logger.error('Could not parse JSON from response:', text);
      throw new Error('Invalid JSON response from AI service');
    }
  }

  async analyzeEmail(emailData) {
    try {
      const { subject_line, preview_text, email_content, target_audience, campaign_type } = emailData;

      const prompt = `
Analyze this email marketing content and provide detailed feedback. Respond ONLY with valid JSON in this exact format:

{
  "analysis": {
    "subject_line_score": 7,
    "preview_text_score": 8,
    "content_score": 6,
    "spam_risk": "low",
    "readability": "good",
    "sentiment": "positive",
    "urgency_level": "medium",
    "personalization_level": "low"
  },
  "issues": [
    "Subject line could be more specific",
    "Missing clear call-to-action"
  ],
  "strengths": [
    "Good preview text length",
    "Positive sentiment"
  ]
}

Email content to analyze:
SUBJECT LINE: "${subject_line}"
PREVIEW TEXT: "${preview_text}"
EMAIL CONTENT: "${email_content}"
TARGET AUDIENCE: ${target_audience}
CAMPAIGN TYPE: ${campaign_type}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysis = this.extractJSONFromResponse(response.text());
      
      logger.info('Email analysis completed:', analysis);
      
      return analysis;
    } catch (error) {
      logger.error('Error in email analysis:', error);
      throw new Error('Failed to analyze email content');
    }
  }

  async predictPerformance(emailData, historicalData = null) {
    try {
      const { subject_line, preview_text, email_content, target_audience, campaign_type } = emailData;

      const prompt = `
Predict email performance based on this content. Respond ONLY with valid JSON in this exact format:

{
  "predictions": {
    "predicted_open_rate": "24.5%",
    "predicted_click_rate": "3.2%",
    "predicted_conversion_rate": "1.8%",
    "confidence_level": "medium",
    "risk_factors": [
      "Subject line could be more compelling"
    ],
    "opportunities": [
      "Add more personalization"
    ]
  }
}

Email content:
SUBJECT LINE: "${subject_line}"
PREVIEW TEXT: "${preview_text}"
EMAIL CONTENT: "${email_content}"
TARGET AUDIENCE: ${target_audience}
CAMPAIGN TYPE: ${campaign_type}
${historicalData ? `HISTORICAL PERFORMANCE: ${JSON.stringify(historicalData)}` : ''}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const predictions = this.extractJSONFromResponse(response.text());
      
      logger.info('Performance prediction completed:', predictions);
      
      return predictions;
    } catch (error) {
      logger.error('Error in performance prediction:', error);
      throw new Error('Failed to predict performance');
    }
  }

  async generateSuggestions(analysis, emailData) {
    try {
      const { subject_line, preview_text, email_content, target_audience, campaign_type } = emailData;

      const prompt = `
Generate optimization suggestions. Respond ONLY with valid JSON in this exact format:

{
  "suggestions": {
    "subject_line_alternatives": [
      "Alternative subject line 1",
      "Alternative subject line 2",
      "Alternative subject line 3"
    ],
    "preview_text_improvements": [
      "Improved preview text 1",
      "Improved preview text 2"
    ],
    "content_optimizations": [
      "Add more personalization",
      "Include clear call-to-action"
    ],
    "ab_testing_recommendations": [
      "Test different subject lines",
      "Test send times"
    ],
    "send_time_suggestions": [
      "Send on Tuesday at 10 AM",
      "Send on Thursday at 2 PM"
    ]
  }
}

Analysis: ${JSON.stringify(analysis)}
Original content:
- Subject: "${subject_line}"
- Preview: "${preview_text}"
- Content: "${email_content}"
- Audience: ${target_audience}
- Type: ${campaign_type}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestions = this.extractJSONFromResponse(response.text());
      
      logger.info('Optimization suggestions generated:', suggestions);
      
      return suggestions;
    } catch (error) {
      logger.error('Error generating suggestions:', error);
      throw new Error('Failed to generate optimization suggestions');
    }
  }

  async generateEmailIdeas(campaignType, audience, goals) {
    try {
      const prompt = `
Generate email marketing ideas. Respond ONLY with valid JSON in this exact format:

{
  "ideas": [
    {
      "title": "Idea Title",
      "description": "Brief description",
      "subject_line": "Suggested subject line",
      "key_points": ["Point 1", "Point 2"],
      "estimated_performance": "high/medium/low"
    }
  ]
}

Campaign Type: ${campaignType}
Target Audience: ${audience}
Goals: ${goals}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const ideas = this.extractJSONFromResponse(response.text());
      
      logger.info('Email ideas generated:', ideas);
      
      return ideas;
    } catch (error) {
      logger.error('Error generating email ideas:', error);
      throw new Error('Failed to generate email ideas');
    }
  }

  async generateEmailCopy(copyData) {
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
      } = copyData;

      const prompt = `
Generate professional, grammatically correct email copy based on the following requirements. 
The copy should be engaging, persuasive, and optimized for email marketing best practices.

Respond ONLY with valid JSON in this exact format:

{
  "subject_line": "Compelling subject line (under 50 characters)",
  "preview_text": "Preview text that appears in email clients (under 150 characters)",
  "email_body": "Full email body content, including call-to-action. Use markdown for formatting (e.g., headings, bold, italics)."
}

Requirements:
- Campaign Purpose: ${campaign_purpose}
- Product/Service: ${product_service}
- Target Audience: ${target_audience}
- Email Category: ${category}
- Tone: ${tone}
- Call to Action: ${call_to_action || 'Not specified'}
- Special Offers: ${special_offers || 'None'}
- Additional Notes: ${additional_notes || 'None'}

Guidelines:
1. Subject line should be compelling and under 50 characters
2. Preview text should be engaging and under 150 characters
3. Email content should be well-structured with proper grammar
4. Include appropriate greeting and closing
5. Make the content relevant to the target audience
6. Use the specified tone throughout
7. Include a clear call-to-action
8. Mention special offers if provided
9. Ensure the content is professional and error-free
10. Use line breaks for better readability

Generate copy that is ready to use in email marketing campaigns.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const copy = this.extractJSONFromResponse(response.text());
      
      logger.info('Email copy generated:', {
        subject_line: copy.subject_line?.substring(0, 50) + '...',
        category,
        target_audience
      });
      
      return copy;
    } catch (error) {
      logger.error('Error generating email copy:', error);
      throw new Error('Failed to generate email copy');
    }
  }

  async generateBlogCopy(copyData) {
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
      } = copyData;

      const prompt = `
Generate engaging blog content based on the following requirements. 
The blog should be informative, valuable, and optimized for SEO and reader engagement.

Respond ONLY with valid JSON in this exact format:

{
  "title": "Compelling blog title (under 60 characters)",
  "meta_description": "SEO meta description (under 160 characters)",
  "introduction": "Engaging introduction paragraph",
  "main_content": "Main blog content with proper structure, headings, and formatting. Use markdown for formatting.",
  "conclusion": "Strong conclusion with call-to-action",
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"],
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "estimated_read_time": "5-7 minutes"
}

Requirements:
- Campaign Purpose: ${campaign_purpose}
- Product/Service: ${product_service}
- Target Audience: ${target_audience}
- Content Category: ${category}
- Tone: ${tone}
- Call to Action: ${call_to_action || 'Not specified'}
- Special Offers: ${special_offers || 'None'}
- Additional Notes: ${additional_notes || 'None'}

Guidelines:
1. Title should be compelling and SEO-optimized
2. Meta description should be engaging and under 160 characters
3. Introduction should hook the reader immediately
4. Main content should be well-structured with headings and subheadings
5. Include relevant examples, statistics, or case studies when appropriate
6. Use the specified tone throughout
7. Include a clear call-to-action in the conclusion
8. Provide 3-5 key takeaways for readers
9. Suggest relevant tags for categorization
10. Estimate realistic read time
11. Ensure content is valuable and informative, not just promotional
12. Use markdown formatting for better structure

Generate blog content that provides real value to readers while supporting the campaign goals.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const blogCopy = this.extractJSONFromResponse(response.text());
      
      logger.info('Blog copy generated:', {
        title: blogCopy.title?.substring(0, 50) + '...',
        category,
        target_audience
      });
      
      return blogCopy;
    } catch (error) {
      logger.error('Error generating blog copy:', error);
      throw new Error('Failed to generate blog copy');
    }
  }

  async generateSocialMediaPost(copyData) {
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
      } = copyData;

      const prompt = `
Generate engaging social media content based on the following requirements. 
Create content optimized for multiple platforms with appropriate hashtags and image descriptions.

Respond ONLY with valid JSON in this exact format:

{
  "platforms": {
    "instagram": {
      "caption": "Instagram caption with emojis and hashtags (under 2200 characters)",
      "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
      "image_description": "Detailed description for image generation AI (e.g., DALL-E, Midjourney)"
    },
    "facebook": {
      "post": "Facebook post content (under 63206 characters)",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "image_description": "Detailed description for image generation AI"
    },
    "twitter": {
      "tweet": "Twitter post content (under 280 characters)",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "image_description": "Detailed description for image generation AI"
    },
    "linkedin": {
      "post": "LinkedIn professional post content",
      "hashtags": ["#hashtag1", "#hashtag2"],
      "image_description": "Detailed description for image generation AI"
    }
  },
  "image_prompt": "Comprehensive image generation prompt for creating a compelling visual that matches the content theme and tone",
  "content_theme": "Brief description of the overall content theme and visual style"
}

Requirements:
- Campaign Purpose: ${campaign_purpose}
- Product/Service: ${product_service}
- Target Audience: ${target_audience}
- Content Category: ${category}
- Tone: ${tone}
- Call to Action: ${call_to_action || 'Not specified'}
- Special Offers: ${special_offers || 'None'}
- Additional Notes: ${additional_notes || 'None'}

Guidelines:
1. Instagram: Use emojis, engaging captions, and relevant hashtags
2. Facebook: Longer-form content with detailed explanations
3. Twitter: Concise, impactful messages within character limits
4. LinkedIn: Professional tone with industry insights
5. Image descriptions should be detailed enough for AI image generation
6. Use platform-specific best practices for each social network
7. Include relevant hashtags for discoverability
8. Maintain consistent messaging across platforms
9. Create compelling image prompts that match the content theme
10. Ensure content is engaging and shareable
11. Include clear call-to-action where appropriate
12. Consider the target audience for each platform

Generate social media content that will drive engagement and support the campaign objectives.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const socialMediaPost = this.extractJSONFromResponse(response.text());
      
      logger.info('Social media post generated:', {
        category,
        target_audience,
        platforms: Object.keys(socialMediaPost.platforms || {})
      });
      
      return socialMediaPost;
    } catch (error) {
      logger.error('Error generating social media post:', error);
      throw new Error('Failed to generate social media post');
    }
  }

  async generateSendTimeRecommendations(historicalData, audienceSegment) {
    try {
      const prompt = `
Analyze the provided email campaign data and recommend optimal send times for different audience segments.

Respond ONLY with valid JSON in this exact format:

{
  "send_time_recommendations": {
    "best_days": ["Monday", "Tuesday", "Thursday"],
    "best_hours": ["9:00 AM", "2:00 PM", "6:00 PM"],
    "timezone_considerations": "Consider subscriber timezone distribution",
    "seasonal_adjustments": {
      "holiday_season": "Send 1-2 hours earlier",
      "summer_months": "Send 1 hour later",
      "weekend_behavior": "Avoid weekends except for special campaigns"
    },
    "audience_specific_timing": {
      "b2b_audience": "Tuesday-Thursday, 9 AM - 11 AM",
      "b2c_audience": "Tuesday-Thursday, 6 PM - 8 PM",
      "international_audience": "Consider multiple timezones"
    }
  },
  "optimization_tips": [
    "Test different send times for each segment",
    "Monitor open rates by time of day",
    "Consider subscriber timezone"
  ],
  "data_insights": {
    "highest_engagement_day": "Tuesday",
    "highest_engagement_hour": "10:00 AM",
    "lowest_engagement_day": "Sunday",
    "timezone_impact": "High - consider segmenting by timezone"
  }
}

Historical Data: ${JSON.stringify(historicalData)}
Audience Segment: ${audienceSegment}

Analyze patterns in open rates, click rates, and conversion rates by day of week and time of day.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendations = this.extractJSONFromResponse(response.text());
      
      logger.info('Send time recommendations generated:', {
        audienceSegment,
        bestDays: recommendations.send_time_recommendations?.best_days
      });
      
      return recommendations;
    } catch (error) {
      logger.error('Error generating send time recommendations:', error);
      throw new Error('Failed to generate send time recommendations');
    }
  }

  async generateContentCalendar(campaignGoals, industry, timeframe = '90') {
    try {
      const prompt = `
Generate a comprehensive content calendar for email marketing campaigns based on the provided goals and industry.

Respond ONLY with valid JSON in this exact format:

{
  "content_calendar": [
    {
      "week": 1,
      "theme": "Industry Trend Analysis",
      "campaign_type": "newsletter",
      "content_topics": [
        "Top 5 Industry Trends for 2024",
        "How to Stay Ahead of the Competition",
        "Expert Insights and Predictions"
      ],
      "key_messages": [
        "Position as industry thought leader",
        "Provide valuable insights",
        "Encourage engagement and discussion"
      ],
      "call_to_actions": [
        "Download our industry report",
        "Join our expert webinar",
        "Share your thoughts in comments"
      ]
    }
  ],
  "seasonal_campaigns": [
    {
      "season": "Q1",
      "themes": ["New Year Planning", "Goal Setting", "Fresh Starts"],
      "campaign_focus": "Planning and preparation"
    }
  ],
  "content_themes": [
    "Educational content",
    "Product updates",
    "Customer success stories",
    "Industry insights"
  ],
  "campaign_frequency": {
    "newsletter": "Weekly",
    "promotional": "Bi-weekly",
    "educational": "Monthly",
    "seasonal": "Quarterly"
  }
}

Campaign Goals: ${campaignGoals}
Industry: ${industry}
Timeframe: ${timeframe} days

Create a strategic content calendar that aligns with business objectives and industry best practices.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const calendar = this.extractJSONFromResponse(response.text());
      
      logger.info('Content calendar generated:', {
        industry,
        timeframe,
        weeks: calendar.content_calendar?.length
      });
      
      return calendar;
    } catch (error) {
      logger.error('Error generating content calendar:', error);
      throw new Error('Failed to generate content calendar');
    }
  }

  async generateABTestSuggestions(campaignData, historicalPerformance) {
    try {
      const prompt = `
Analyze the campaign data and historical performance to suggest effective A/B tests for email optimization.

Respond ONLY with valid JSON in this exact format:

{
  "ab_test_suggestions": [
    {
      "test_name": "Subject Line Personalization",
      "test_type": "subject_line",
      "hypothesis": "Personalized subject lines will increase open rates by 15%",
      "variant_a": "Control: Standard subject line",
      "variant_b": "Test: Personalized with subscriber name",
      "success_metrics": ["open_rate", "click_rate"],
      "expected_improvement": "15% increase in open rate",
      "confidence_level": "high",
      "test_duration": "7 days",
      "sample_size": "10,000 subscribers per variant"
    }
  ],
  "priority_tests": [
    "High priority tests to run first",
    "Medium priority tests for later",
    "Low priority tests for optimization"
  ],
  "testing_strategy": {
    "test_frequency": "Run 2-3 tests simultaneously",
    "test_duration": "7-14 days minimum",
    "statistical_significance": "95% confidence level",
    "sample_size_requirements": "Minimum 1,000 subscribers per variant"
  },
  "historical_insights": {
    "best_performing_elements": ["Personalization", "Urgency", "Clear CTAs"],
    "areas_for_improvement": ["Subject line length", "Send time optimization"],
    "successful_test_patterns": ["Personalization tests", "CTA placement tests"]
  }
}

Campaign Data: ${JSON.stringify(campaignData)}
Historical Performance: ${JSON.stringify(historicalPerformance)}

Focus on tests that have shown the highest impact in similar campaigns and industries.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestions = this.extractJSONFromResponse(response.text());
      
      logger.info('A/B test suggestions generated:', {
        testCount: suggestions.ab_test_suggestions?.length,
        priorityLevels: suggestions.priority_tests?.length
      });
      
      return suggestions;
    } catch (error) {
      logger.error('Error generating A/B test suggestions:', error);
      throw new Error('Failed to generate A/B test suggestions');
    }
  }

  async detectPerformanceAnomalies(campaignData, historicalBaseline) {
    try {
      const prompt = `
Analyze the campaign performance data and compare it against historical baselines to detect anomalies and unusual patterns.

Respond ONLY with valid JSON in this exact format:

{
  "anomalies_detected": [
    {
      "metric": "open_rate",
      "current_value": "25.5%",
      "baseline_value": "18.2%",
      "deviation": "+40.1%",
      "severity": "high",
      "description": "Open rate is significantly higher than baseline",
      "possible_causes": [
        "Subject line optimization",
        "Improved send time",
        "Better audience targeting"
      ],
      "recommendation": "Investigate what caused the improvement and replicate"
    }
  ],
  "performance_insights": {
    "improving_metrics": ["open_rate", "click_rate"],
    "declining_metrics": ["conversion_rate"],
    "stable_metrics": ["bounce_rate"]
  },
  "alert_level": "medium",
  "recommended_actions": [
    "Investigate conversion rate decline",
    "Replicate successful subject line strategies",
    "Monitor for sustained improvements"
  ],
  "trend_analysis": {
    "short_term_trend": "improving",
    "long_term_trend": "stable",
    "seasonal_factors": "None detected"
  }
}

Campaign Data: ${JSON.stringify(campaignData)}
Historical Baseline: ${JSON.stringify(historicalBaseline)}

Identify significant deviations from normal performance patterns and provide actionable insights.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const anomalies = this.extractJSONFromResponse(response.text());
      
      logger.info('Performance anomalies detected:', {
        anomalyCount: anomalies.anomalies_detected?.length,
        alertLevel: anomalies.alert_level
      });
      
      return anomalies;
    } catch (error) {
      logger.error('Error detecting performance anomalies:', error);
      throw new Error('Failed to detect performance anomalies');
    }
  }

  async generateCampaignSequence(campaignGoals, audienceData, productInfo) {
    try {
      const prompt = `
Design an optimal email campaign sequence based on the campaign goals, audience data, and product information.

Respond ONLY with valid JSON in this exact format:

{
  "campaign_sequence": [
    {
      "email_number": 1,
      "type": "welcome",
      "subject_line": "Welcome to [Product] - Let's Get Started!",
      "purpose": "Introduce the product and set expectations",
      "timing": "Immediately after signup",
      "key_content": [
        "Welcome message and product overview",
        "Getting started guide",
        "First value proposition"
      ],
      "call_to_action": "Complete your profile",
      "success_metrics": ["open_rate", "click_rate", "profile_completion"]
    }
  ],
  "sequence_strategy": {
    "total_emails": 7,
    "frequency": "Every 3-5 days",
    "goal": "Convert prospects to customers",
    "expected_conversion_rate": "12-15%",
    "dropout_points": ["Email 3", "Email 5"]
  },
  "personalization_opportunities": [
    "Use subscriber name in subject lines",
    "Segment by signup source",
    "Customize content based on interests"
  ],
  "optimization_recommendations": [
    "Test different send times for each email",
    "A/B test subject lines for emails 2-4",
    "Monitor engagement and adjust frequency"
  ]
}

Campaign Goals: ${campaignGoals}
Audience Data: ${JSON.stringify(audienceData)}
Product Info: ${productInfo}

Create a sequence that guides subscribers through a logical journey toward conversion.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const sequence = this.extractJSONFromResponse(response.text());
      
      logger.info('Campaign sequence generated:', {
        emailCount: sequence.campaign_sequence?.length,
        expectedConversion: sequence.sequence_strategy?.expected_conversion_rate
      });
      
      return sequence;
    } catch (error) {
      logger.error('Error generating campaign sequence:', error);
      throw new Error('Failed to generate campaign sequence');
    }
  }

  async predictLeadScore(contact, activities) {
    try {
      const prompt = `
Analyze the following marketing lead and predict their score and status.
Respond ONLY with a valid JSON object in this exact format:

{
  "predicted_score": 85,
  "status": "Hot",
  "reasoning": "This lead has a high open and click rate, indicating strong interest.",
  "recommendation": "Engage immediately with a personalized offer."
}

LEAD DATA:
- Contact: ${JSON.stringify(contact)}
- Recent Activities: ${JSON.stringify(activities)}

Based on this data, provide your prediction.
`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const prediction = this.extractJSONFromResponse(response.text());

      logger.info('Lead score prediction completed:', prediction);

      return prediction;
    } catch (error) {
      logger.error('Error in lead score prediction:', error);
      // Return a default/fallback object in case of AI error
      return {
        predicted_score: 50, // Neutral score
        status: 'Uncertain',
        reasoning: 'Could not determine score due to an AI service error.',
        recommendation: 'Manual review suggested.'
      };
    }
  }

  async getBenchmarks(industry = 'general') {
    try {
      const prompt = `
Provide email marketing benchmarks. Respond ONLY with valid JSON in this exact format:

{
  "benchmarks": {
    "open_rate": {
      "average": "21.5%",
      "good": "25.0%",
      "excellent": "30.0%"
    },
    "click_rate": {
      "average": "2.5%",
      "good": "3.5%",
      "excellent": "5.0%"
    },
    "conversion_rate": {
      "average": "1.2%",
      "good": "2.0%",
      "excellent": "3.5%"
    },
    "best_practices": [
      "Keep subject lines under 50 characters",
      "Use clear call-to-actions"
    ],
    "common_mistakes": [
      "Avoid spam trigger words",
      "Don't send too frequently"
    ]
  }
}

Industry: ${industry}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const benchmarks = this.extractJSONFromResponse(response.text());
      
      logger.info('Benchmarks retrieved:', benchmarks);
      
      return benchmarks;
    } catch (error) {
      logger.error('Error getting benchmarks:', error);
      throw new Error('Failed to retrieve benchmarks');
    }
  }

  async analyzeWithGemini(data, prompt) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Error in Gemini analysis:', error);
      throw new Error('Failed to analyze with Gemini');
    }
  }

  // Audience Intelligence Methods
  async predictSegments(subscriberData, historicalBehavior) {
    try {
      const prompt = `
Analyze subscriber data and predict high-value segments before they become obvious. Respond ONLY with valid JSON in this exact format:

{
  "predicted_segments": [
    {
      "segment_name": "High-Value Prospects",
      "confidence_score": 85,
      "criteria": ["high engagement", "recent activity", "similar to existing customers"],
      "subscriber_count": 150,
      "potential_value": "$15,000",
      "recommended_actions": [
        "Send personalized onboarding sequence",
        "Offer exclusive early access",
        "Assign dedicated account manager"
      ]
    }
  ],
  "insights": [
    "Segment A shows 40% higher engagement than average",
    "Segment B has similar behavior patterns to existing VIP customers"
  ],
  "recommendations": [
    "Create targeted campaigns for predicted segments",
    "Implement early intervention strategies"
  ]
}

Subscriber Data: ${JSON.stringify(subscriberData)}
Historical Behavior: ${JSON.stringify(historicalBehavior)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const segments = this.extractJSONFromResponse(response.text());
      
      logger.info('Predictive segmentation completed:', segments);
      
      return segments;
    } catch (error) {
      logger.error('Error in predictive segmentation:', error);
      throw new Error('Failed to predict segments');
    }
  }

  async predictChurn(subscriberData, engagementHistory, purchaseHistory) {
    try {
      const prompt = `
Predict which subscribers are likely to churn in the next 30 days. Respond ONLY with valid JSON in this exact format:

{
  "churn_predictions": [
    {
      "subscriber_id": "user123",
      "churn_probability": 78,
      "risk_level": "high",
      "warning_signs": [
        "Decreasing email opens",
        "No recent purchases",
        "Reduced website activity"
      ],
      "days_to_churn": 15,
      "recommended_actions": [
        "Send re-engagement campaign",
        "Offer personalized discount",
        "Schedule retention call"
      ]
    }
  ],
  "overall_churn_rate": "12.5%",
  "high_risk_count": 45,
  "medium_risk_count": 120,
  "low_risk_count": 835,
  "prevention_strategies": [
    "Implement win-back campaigns for high-risk subscribers",
    "Create engagement-based segmentation",
    "Offer loyalty rewards for at-risk customers"
  ]
}

Subscriber Data: ${JSON.stringify(subscriberData)}
Engagement History: ${JSON.stringify(engagementHistory)}
Purchase History: ${JSON.stringify(purchaseHistory)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const predictions = this.extractJSONFromResponse(response.text());
      
      logger.info('Churn prediction completed:', predictions);
      
      return predictions;
    } catch (error) {
      logger.error('Error in churn prediction:', error);
      throw new Error('Failed to predict churn');
    }
  }

  async calculateEngagementScore(subscriberData, recentActivity) {
    try {
      const prompt = `
Calculate real-time engagement scores for subscribers. Respond ONLY with valid JSON in this exact format:

{
  "engagement_scores": [
    {
      "subscriber_id": "user123",
      "overall_score": 87,
      "email_engagement": 92,
      "website_engagement": 78,
      "purchase_engagement": 85,
      "social_engagement": 65,
      "engagement_level": "high",
      "trend": "increasing",
      "recommendations": [
        "Consider for VIP program",
        "Target for referral campaign",
        "Offer early access to new products"
      ]
    }
  ],
  "score_breakdown": {
    "high_engagement": 25,
    "medium_engagement": 45,
    "low_engagement": 30
  },
  "engagement_trends": [
    "Overall engagement increased 15% this month",
    "Email engagement highest on Tuesdays and Thursdays"
  ]
}

Subscriber Data: ${JSON.stringify(subscriberData)}
Recent Activity: ${JSON.stringify(recentActivity)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const scores = this.extractJSONFromResponse(response.text());
      
      logger.info('Engagement scoring completed:', scores);
      
      return scores;
    } catch (error) {
      logger.error('Error in engagement scoring:', error);
      throw new Error('Failed to calculate engagement scores');
    }
  }

  async developPersonas(subscriberData, behaviorPatterns, demographics) {
    try {
      const prompt = `
Create detailed buyer personas from subscriber data. Respond ONLY with valid JSON in this exact format:

{
  "personas": [
    {
      "persona_name": "Sarah the Early Adopter",
      "demographics": {
        "age_range": "25-35",
        "location": "Urban areas",
        "income_level": "Middle to upper-middle",
        "occupation": "Tech professionals"
      },
      "behavior_patterns": [
        "Opens emails within 2 hours",
        "Makes purchases on mobile",
        "Engages with new product launches",
        "Shares content on social media"
      ],
      "pain_points": [
        "Wants latest technology",
        "Values convenience",
        "Seeks social proof"
      ],
      "motivations": [
        "Stay ahead of trends",
        "Save time and effort",
        "Build social status"
      ],
      "preferred_channels": ["Email", "Mobile app", "Social media"],
      "content_preferences": ["Product launches", "How-to guides", "User testimonials"],
      "segment_size": 250,
      "lifetime_value": "$2,500",
      "recommended_strategies": [
        "Send early access to new products",
        "Create mobile-first content",
        "Encourage social sharing"
      ]
    }
  ],
  "persona_insights": [
    "Persona A represents 30% of total subscribers",
    "Persona B has highest average order value",
    "Persona C most likely to refer others"
  ],
  "targeting_recommendations": [
    "Create persona-specific email sequences",
    "Develop targeted content strategies",
    "Optimize send times per persona"
  ]
}

Subscriber Data: ${JSON.stringify(subscriberData)}
Behavior Patterns: ${JSON.stringify(behaviorPatterns)}
Demographics: ${JSON.stringify(demographics)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const personas = this.extractJSONFromResponse(response.text());
      
      logger.info('Persona development completed:', personas);
      
      return personas;
    } catch (error) {
      logger.error('Error in persona development:', error);
      throw new Error('Failed to develop personas');
    }
  }

  // Advanced Analytics Methods
  async detectAnomalies(performanceData, historicalBaseline) {
    try {
      const prompt = `
Detect performance anomalies in campaign data. Respond ONLY with valid JSON in this exact format:

{
  "anomalies": [
    {
      "metric": "open_rate",
      "current_value": "15.2%",
      "expected_value": "24.5%",
      "deviation": "-38%",
      "severity": "high",
      "possible_causes": [
        "Subject line issues",
        "Send time problems",
        "List quality decline"
      ],
      "recommended_actions": [
        "A/B test subject lines",
        "Review send time optimization",
        "Clean email list"
      ]
    }
  ],
  "overall_health": "warning",
  "trends": [
    "Open rates declining over past 3 campaigns",
    "Click rates stable but below target"
  ],
  "alerts": [
    "High priority: Open rate anomaly detected",
    "Medium priority: Monitor click rate trends"
  ]
}

Performance Data: ${JSON.stringify(performanceData)}
Historical Baseline: ${JSON.stringify(historicalBaseline)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const anomalies = this.extractJSONFromResponse(response.text());
      
      logger.info('Anomaly detection completed:', anomalies);
      
      return anomalies;
    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      throw new Error('Failed to detect anomalies');
    }
  }

  async predictROI(campaignData, historicalROI, audienceData) {
    try {
      const prompt = `
Predict campaign ROI before sending. Respond ONLY with valid JSON in this exact format:

{
  "roi_prediction": {
    "predicted_roi": "320%",
    "confidence_level": "high",
    "predicted_revenue": "$15,000",
    "predicted_cost": "$4,700",
    "predicted_profit": "$10,300"
  },
  "factors": [
    {
      "factor": "Audience quality",
      "impact": "positive",
      "contribution": "+15%"
    },
    {
      "factor": "Subject line strength",
      "impact": "positive", 
      "contribution": "+8%"
    },
    {
      "factor": "Send time",
      "impact": "neutral",
      "contribution": "0%"
    }
  ],
  "risk_factors": [
    "Competition from similar campaigns",
    "Seasonal fluctuations"
  ],
  "optimization_opportunities": [
    "Improve subject line for +5% ROI",
    "Target high-value segments for +10% ROI"
  ],
  "recommendations": [
    "Proceed with campaign as planned",
    "Consider A/B testing subject lines",
    "Monitor performance closely"
  ]
}

Campaign Data: ${JSON.stringify(campaignData)}
Historical ROI: ${JSON.stringify(historicalROI)}
Audience Data: ${JSON.stringify(audienceData)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const prediction = this.extractJSONFromResponse(response.text());
      
      logger.info('ROI prediction completed:', prediction);
      
      return prediction;
    } catch (error) {
      logger.error('Error in ROI prediction:', error);
      throw new Error('Failed to predict ROI');
    }
  }

  async optimizeABTests(campaignData, historicalTests) {
    try {
      const prompt = `
Suggest optimal A/B tests and predict winners. Respond ONLY with valid JSON in this exact format:

{
  "ab_test_suggestions": [
    {
      "test_name": "Subject Line Test",
      "test_type": "subject_line",
      "variants": [
        {
          "variant": "A",
          "content": "Exclusive: 50% Off Everything",
          "predicted_winner": true,
          "predicted_open_rate": "28.5%"
        },
        {
          "variant": "B", 
          "content": "Flash Sale: 50% Off Everything",
          "predicted_winner": false,
          "predicted_open_rate": "25.2%"
        }
      ],
      "confidence": "high",
      "expected_improvement": "+13%",
      "recommended_duration": "7 days"
    }
  ],
  "test_priorities": [
    "High: Subject line testing",
    "Medium: Send time optimization", 
    "Low: CTA button color"
  ],
  "predictions": [
    "Subject line A will win with 85% confidence",
    "Send time optimization could improve opens by 8%"
  ],
  "recommendations": [
    "Run subject line test first",
    "Use statistical significance of 95%",
    "Monitor for 7 days minimum"
  ]
}

Campaign Data: ${JSON.stringify(campaignData)}
Historical Tests: ${JSON.stringify(historicalTests)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const suggestions = this.extractJSONFromResponse(response.text());
      
      logger.info('A/B test optimization completed:', suggestions);
      
      return suggestions;
    } catch (error) {
      logger.error('Error in A/B test optimization:', error);
      throw new Error('Failed to optimize A/B tests');
    }
  }

  async analyzeSeasonalTrends(historicalData, timeRange) {
    try {
      const prompt = `
Analyze seasonal trends in email marketing performance. Respond ONLY with valid JSON in this exact format:

{
  "seasonal_patterns": [
    {
      "season": "Q4 Holiday",
      "months": ["October", "November", "December"],
      "performance_boost": "+25%",
      "best_performing_content": "Holiday promotions",
      "optimal_send_times": ["Tuesday 10 AM", "Thursday 2 PM"],
      "recommendations": [
        "Increase send frequency",
        "Focus on gift guides",
        "Use holiday-themed subject lines"
      ]
    }
  ],
  "trend_insights": [
    "Open rates peak during holiday seasons",
    "Click rates highest on weekdays",
    "Conversion rates improve with urgency"
  ],
  "forecasting": {
    "next_quarter_prediction": "+15%",
    "confidence_level": "medium",
    "key_factors": [
      "Seasonal demand increase",
      "Competition intensity",
      "Economic conditions"
    ]
  },
  "optimization_strategies": [
    "Plan campaigns around seasonal peaks",
    "Adjust content themes seasonally",
    "Optimize send times per season"
  ]
}

Historical Data: ${JSON.stringify(historicalData)}
Time Range: ${timeRange}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const trends = this.extractJSONFromResponse(response.text());
      
      logger.info('Seasonal trend analysis completed:', trends);
      
      return trends;
    } catch (error) {
      logger.error('Error in seasonal trend analysis:', error);
      throw new Error('Failed to analyze seasonal trends');
    }
  }

  // Smart Recommendations Methods
  async generateSubjectLineABTests(campaignData, historicalPerformance) {
    try {
      const prompt = `
Generate A/B test subject lines for email campaigns. Respond ONLY with valid JSON in this exact format:

{
  "ab_tests": [
    {
      "test_name": "Urgency vs Value",
      "variant_a": {
        "subject_line": "Last Chance: 50% Off Ends Tonight",
        "type": "urgency",
        "predicted_open_rate": "28.5%",
        "strengths": ["Creates urgency", "Clear deadline", "Strong offer"]
      },
      "variant_b": {
        "subject_line": "Save 50% on Everything You Love",
        "type": "value",
        "predicted_open_rate": "26.2%",
        "strengths": ["Emphasizes value", "Personal touch", "Broad appeal"]
      },
      "recommended_winner": "A",
      "confidence": "high",
      "expected_improvement": "+8.8%"
    }
  ],
  "test_strategies": [
    "Test urgency vs value propositions",
    "Test personalization vs generic",
    "Test question vs statement format"
  ],
  "best_practices": [
    "Keep subject lines under 50 characters",
    "Avoid spam trigger words",
    "Use numbers and specific offers"
  ]
}

Campaign Data: ${JSON.stringify(campaignData)}
Historical Performance: ${JSON.stringify(historicalPerformance)}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const tests = this.extractJSONFromResponse(response.text());
      
      logger.info('Subject line A/B tests generated:', tests);
      
      return tests;
    } catch (error) {
      logger.error('Error generating subject line A/B tests:', error);
      throw new Error('Failed to generate A/B tests');
    }
  }

  async optimizeEmailContent(emailContent, targetAudience, campaignGoals) {
    try {
      const prompt = `
Optimize email content for better performance. Respond ONLY with valid JSON in this exact format:

{
  "optimized_content": {
    "original_content": "Original email content here",
    "optimized_content": "Optimized email content here",
    "key_improvements": [
      "Added clear call-to-action",
      "Improved readability",
      "Enhanced personalization"
    ]
  },
  "content_scores": {
    "readability_score": 85,
    "engagement_score": 78,
    "conversion_score": 82,
    "overall_score": 82
  },
  "optimization_suggestions": [
    {
      "section": "Introduction",
      "suggestion": "Add personalization with subscriber name",
      "impact": "medium",
      "expected_improvement": "+5%"
    },
    {
      "section": "Call-to-Action",
      "suggestion": "Make CTA more prominent and urgent",
      "impact": "high",
      "expected_improvement": "+12%"
    }
  ],
  "best_practices_applied": [
    "Clear value proposition",
    "Scannable content structure",
    "Mobile-friendly formatting"
  ]
}

Email Content: ${JSON.stringify(emailContent)}
Target Audience: ${targetAudience}
Campaign Goals: ${campaignGoals}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const optimization = this.extractJSONFromResponse(response.text());
      
      logger.info('Email content optimization completed:', optimization);
      
      return optimization;
    } catch (error) {
      logger.error('Error optimizing email content:', error);
      throw new Error('Failed to optimize email content');
    }
  }

  async recommendImages(campaignTheme, targetAudience, contentType) {
    try {
      const prompt = `
Recommend images for email campaigns. Respond ONLY with valid JSON in this exact format:

{
  "image_recommendations": [
    {
      "image_type": "hero_image",
      "description": "Professional team collaborating in modern office",
      "style": "corporate",
      "colors": ["blue", "white", "gray"],
      "emotions": ["trust", "professionalism", "collaboration"],
      "placement": "header",
      "size_recommendation": "600x300px",
      "alt_text": "Team collaboration in modern office environment"
    }
  ],
  "visual_strategy": {
    "overall_theme": "professional and trustworthy",
    "color_palette": ["#2563eb", "#ffffff", "#6b7280"],
    "image_style": "high-quality, professional photography"
  },
  "image_guidelines": [
    "Use high-resolution images (minimum 600px width)",
    "Ensure images are mobile-responsive",
    "Include descriptive alt text for accessibility"
  ],
  "stock_photo_suggestions": [
    "Unsplash: 'business team'",
    "Pexels: 'office collaboration'",
    "Shutterstock: 'professional meeting'"
  ]
}

Campaign Theme: ${campaignTheme}
Target Audience: ${targetAudience}
Content Type: ${contentType}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const recommendations = this.extractJSONFromResponse(response.text());
      
      logger.info('Image recommendations generated:', recommendations);
      
      return recommendations;
    } catch (error) {
      logger.error('Error recommending images:', error);
      throw new Error('Failed to recommend images');
    }
  }

  async optimizeCTA(ctaData, conversionGoals) {
    try {
      const prompt = `
Optimize call-to-action buttons and links. Respond ONLY with valid JSON in this exact format:

{
  "cta_optimizations": [
    {
      "original_cta": "Click Here",
      "optimized_cta": "Get Your 50% Discount Now",
      "improvement_type": "specific value proposition",
      "expected_improvement": "+15%",
      "reasoning": "More specific about the offer and creates urgency"
    }
  ],
  "placement_recommendations": [
    {
      "position": "above_the_fold",
      "recommendation": "Primary CTA should be visible without scrolling",
      "importance": "high"
    },
    {
      "position": "end_of_content",
      "recommendation": "Secondary CTA for readers who reach the end",
      "importance": "medium"
    }
  ],
  "design_optimizations": [
    {
      "element": "button_color",
      "recommendation": "Use high-contrast colors (red or orange)",
      "impact": "medium"
    },
    {
      "element": "button_size",
      "recommendation": "Make buttons large enough for mobile (44px minimum)",
      "impact": "high"
    }
  ],
  "best_practices": [
    "Use action-oriented language",
    "Create urgency when appropriate",
    "Make CTAs stand out visually",
    "Test different button colors and text"
  ]
}

CTA Data: ${JSON.stringify(ctaData)}
Conversion Goals: ${conversionGoals}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const optimizations = this.extractJSONFromResponse(response.text());
      
      logger.info('CTA optimization completed:', optimizations);
      
      return optimizations;
    } catch (error) {
      logger.error('Error optimizing CTA:', error);
      throw new Error('Failed to optimize CTA');
    }
  }

  // Visual Content Generation Methods
  async generateEmailTemplate(brandData, campaignType) {
    try {
      const prompt = `
Generate custom email template design recommendations. Respond ONLY with valid JSON in this exact format:

{
  "template_design": {
    "layout_type": "single_column",
    "header_style": "centered_logo_with_navigation",
    "content_structure": "hero_image + text + cta + footer",
    "color_scheme": {
      "primary": "#2563eb",
      "secondary": "#ffffff",
      "accent": "#f59e0b",
      "text": "#1f2937"
    }
  },
  "responsive_breakpoints": [
    {
      "device": "desktop",
      "width": "600px",
      "recommendations": ["Full-width layout", "Large images", "Side-by-side content"]
    },
    {
      "device": "mobile",
      "width": "320px",
      "recommendations": ["Single column", "Stacked content", "Large touch targets"]
    }
  ],
  "html_structure": {
    "header": "<!-- Header with logo and navigation -->",
    "hero_section": "<!-- Hero image with headline -->",
    "content_section": "<!-- Main content area -->",
    "cta_section": "<!-- Call-to-action buttons -->",
    "footer": "<!-- Footer with links and unsubscribe -->"
  },
  "css_recommendations": [
    "Use inline CSS for email compatibility",
    "Set max-width to 600px for desktop",
    "Use web-safe fonts (Arial, Helvetica)",
    "Add padding and margins for readability"
  ]
}

Brand Data: ${JSON.stringify(brandData)}
Campaign Type: ${campaignType}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const template = this.extractJSONFromResponse(response.text());
      
      logger.info('Email template generated:', template);
      
      return template;
    } catch (error) {
      logger.error('Error generating email template:', error);
      throw new Error('Failed to generate email template');
    }
  }

  async createInfographic(data, theme, targetAudience) {
    try {
      const prompt = `
Create infographic design recommendations from data. Respond ONLY with valid JSON in this exact format:

{
  "infographic_design": {
    "layout": "vertical_timeline",
    "visual_elements": [
      {
        "type": "chart",
        "data": "conversion_rates",
        "style": "bar_chart",
        "colors": ["#2563eb", "#10b981", "#f59e0b"]
      },
      {
        "type": "icon",
        "element": "email_icon",
        "placement": "header",
        "size": "large"
      }
    ],
    "color_palette": {
      "primary": "#2563eb",
      "secondary": "#10b981",
      "accent": "#f59e0b",
      "background": "#ffffff"
    }
  },
  "content_structure": [
    {
      "section": "header",
      "content": "Email Marketing Performance 2024",
      "style": "large_bold_title"
    },
    {
      "section": "key_metrics",
      "content": "3 main statistics with icons",
      "style": "highlighted_boxes"
    },
    {
      "section": "detailed_data",
      "content": "Charts and graphs",
      "style": "visual_charts"
    }
  ],
  "design_recommendations": [
    "Use consistent color scheme throughout",
    "Include clear data labels and legends",
    "Make text readable at small sizes",
    "Add visual hierarchy with typography"
  ],
  "export_specifications": {
    "format": "PNG",
    "dimensions": "800x1200px",
    "resolution": "300 DPI",
    "color_mode": "RGB"
  }
}

Data: ${JSON.stringify(data)}
Theme: ${theme}
Target Audience: ${targetAudience}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const infographic = this.extractJSONFromResponse(response.text());
      
      logger.info('Infographic design created:', infographic);
      
      return infographic;
    } catch (error) {
      logger.error('Error creating infographic:', error);
      throw new Error('Failed to create infographic');
    }
  }

  async generateVideoScript(videoType, targetAudience, keyMessage) {
    try {
      const prompt = `
Generate video script for marketing content. Respond ONLY with valid JSON in this exact format:

{
  "video_script": {
    "title": "How Our Product Solves Your Problems",
    "duration": "60 seconds",
    "hook": "Did you know that 73% of businesses struggle with email marketing?",
    "scenes": [
      {
        "scene_number": 1,
        "duration": "10 seconds",
        "visual": "Problem statement with statistics",
        "script": "73% of businesses struggle with email marketing effectiveness...",
        "audio": "Background music, clear narration"
      },
      {
        "scene_number": 2,
        "duration": "20 seconds",
        "visual": "Product demonstration",
        "script": "Our AI-powered platform makes email marketing simple...",
        "audio": "Product sounds, upbeat music"
      }
    ],
    "call_to_action": "Visit our website today and start improving your email campaigns!"
  },
  "production_notes": [
    "Use high-quality visuals and graphics",
    "Include captions for accessibility",
    "Keep transitions smooth and professional"
  ],
  "platform_optimizations": {
    "instagram": "Square format (1:1), 60 seconds max",
    "facebook": "Landscape format (16:9), 60 seconds max",
    "youtube": "Landscape format (16:9), 60-120 seconds"
  }
}

Video Type: ${videoType}
Target Audience: ${targetAudience}
Key Message: ${keyMessage}
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const script = this.extractJSONFromResponse(response.text());
      
      logger.info('Video script generated:', script);
      
      return script;
    } catch (error) {
      logger.error('Error generating video script:', error);
      throw new Error('Failed to generate video script');
    }
  }

  async generateLandingPageCopy(landingPageData, conversionGoals) {
    try {
      const { 
        product_service, 
        target_audience, 
        page_type, 
        key_benefits, 
        testimonials, 
        pricing_info 
      } = landingPageData;

      const prompt = `
Generate compelling landing page copy optimized for conversions. Respond ONLY with valid JSON in this exact format:

{
  "hero_section": {
    "headline": "Compelling main headline (under 60 characters)",
    "subheadline": "Supporting subheadline that explains the value proposition",
    "cta_button": "Primary call-to-action button text"
  },
  "benefits_section": {
    "headline": "Benefits section headline",
    "benefits": [
      {
        "title": "Benefit 1",
        "description": "Clear explanation of benefit 1"
      },
      {
        "title": "Benefit 2", 
        "description": "Clear explanation of benefit 2"
      },
      {
        "title": "Benefit 3",
        "description": "Clear explanation of benefit 3"
      }
    ]
  },
  "features_section": {
    "headline": "Features section headline",
    "features": [
      {
        "title": "Feature 1",
        "description": "Description of feature 1"
      },
      {
        "title": "Feature 2",
        "description": "Description of feature 2"
      }
    ]
  },
  "social_proof": {
    "headline": "Social proof section headline",
    "testimonials": [
      {
        "quote": "Customer testimonial quote",
        "author": "Customer name",
        "title": "Customer title/company"
      }
    ],
    "trust_indicators": ["Trust indicator 1", "Trust indicator 2"]
  },
  "pricing_section": {
    "headline": "Pricing section headline",
    "pricing_text": "Compelling pricing copy",
    "cta_button": "Secondary call-to-action button text"
  },
  "faq_section": {
    "headline": "FAQ section headline",
    "questions": [
      {
        "question": "Common question 1",
        "answer": "Clear, helpful answer"
      },
      {
        "question": "Common question 2", 
        "answer": "Clear, helpful answer"
      }
    ]
  },
  "footer_cta": {
    "headline": "Final call-to-action headline",
    "description": "Urgency or incentive text",
    "button_text": "Final CTA button text"
  }
}

Requirements:
- Product/Service: ${product_service}
- Target Audience: ${target_audience}
- Page Type: ${page_type}
- Key Benefits: ${key_benefits || 'Not specified'}
- Testimonials: ${testimonials || 'Not specified'}
- Pricing Info: ${pricing_info || 'Not specified'}
- Conversion Goals: ${conversionGoals}

Guidelines:
1. Hero section should immediately communicate value proposition
2. Use benefit-focused language, not feature-focused
3. Include social proof elements to build trust
4. Create urgency and scarcity where appropriate
5. Use clear, action-oriented language
6. Address common objections in FAQ section
7. Include multiple CTAs throughout the page
8. Optimize for the specified conversion goals
9. Use persuasive copywriting techniques
10. Ensure mobile-friendly content structure
11. Include trust indicators and testimonials
12. Create compelling pricing presentation

Generate landing page copy that will maximize conversions for the specified goals.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const landingPageCopy = this.extractJSONFromResponse(response.text());
      
      logger.info('Landing page copy generated:', {
        page_type,
        target_audience,
        conversion_goals: conversionGoals
      });
      
      return landingPageCopy;
    } catch (error) {
      logger.error('Error generating landing page copy:', error);
      throw new Error('Failed to generate landing page copy');
    }
  }

  async createBlogPost(blogData) {
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
      } = blogData;

      const prompt = `
Create a complete, publish-ready blog post based on the following requirements. 
Generate both the content and the necessary metadata for Shopify blog integration.

Respond ONLY with valid JSON in this exact format:

{
  "blog_post": {
    "title": "SEO-optimized blog title (under 60 characters)",
    "meta_title": "SEO meta title for search engines (under 60 characters)",
    "meta_description": "SEO meta description (under 160 characters)",
    "slug": "url-friendly-slug-for-the-blog-post",
    "author": "Blog Author Name",
    "published_date": "YYYY-MM-DD",
    "tags": ["tag1", "tag2", "tag3", "tag4"],
    "category": "Blog Category",
    "featured_image_alt": "Alt text for featured image",
    "featured_image_description": "Detailed description for AI image generation",
    "content": "Complete blog post content with HTML formatting. Include proper heading structure (h1, h2, h3), paragraphs, lists, and any necessary formatting. Use semantic HTML tags.",
    "excerpt": "Brief excerpt for blog listing pages (under 160 characters)",
    "estimated_read_time": "X minutes",
    "word_count": 1500
  },
  "shopify_metadata": {
    "handle": "url-friendly-handle",
    "template_suffix": "blog-post",
    "published_at": "YYYY-MM-DDTHH:MM:SSZ",
    "published_scope": "web",
    "admin_graphql_api_id": "gid://shopify/Article/123456789",
    "image": {
      "src": "https://cdn.shopify.com/s/files/1/0000/0000/articles/featured-image.jpg",
      "alt": "Alt text for featured image"
    },
    "seo": {
      "title": "SEO title",
      "description": "SEO description"
    }
  },
  "download_files": {
    "html_content": "Complete HTML file content with proper structure and styling",
    "metadata_json": "JSON file with all metadata for manual import"
  }
}

Requirements:
- Topic: ${topic}
- Target Audience: ${target_audience}
- Blog Type: ${blog_type}
- Tone: ${tone}
- Length: ${length}
- Include Images: ${include_images ? 'Yes' : 'No'}
- SEO Focus: ${seo_focus || 'General SEO'}
- Call to Action: ${call_to_action || 'Not specified'}
- Additional Requirements: ${additional_requirements || 'None'}

Guidelines:
1. Title should be compelling and SEO-optimized with target keywords
2. Meta description should be engaging and include primary keywords
3. Content should be well-structured with proper heading hierarchy
4. Include relevant internal and external links where appropriate
5. Use the specified tone consistently throughout
6. Optimize for the target audience's reading level and interests
7. Include a clear call-to-action in the conclusion
8. Generate appropriate tags and categories for discoverability
9. Create compelling featured image descriptions for AI generation
10. Ensure content meets the specified length requirements
11. Include proper HTML formatting for Shopify compatibility
12. Generate SEO-optimized slug and handle
13. Provide complete metadata for Shopify integration
14. Create downloadable HTML and JSON files for manual publishing
15. Include proper excerpt for blog listings
16. Estimate realistic read time based on content length

Generate a complete, professional blog post that's ready for immediate publishing or manual import.
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const blogPost = this.extractJSONFromResponse(response.text());
      
      logger.info('Blog post created:', {
        title: blogPost.blog_post?.title?.substring(0, 50) + '...',
        blog_type,
        target_audience,
        word_count: blogPost.blog_post?.word_count
      });
      
      return blogPost;
    } catch (error) {
      logger.error('Error creating blog post:', error);
      throw new Error('Failed to create blog post');
    }
  }

  async publishToShopify(blogPost, shopifyCredentials) {
    try {
      // This is a placeholder for Shopify API integration
      // In a real implementation, you would use the Shopify Admin API
      // to create articles in the blog
      
      const { shop_domain, access_token } = shopifyCredentials;
      
      // Simulate API call to Shopify
      logger.info('Attempting to publish to Shopify:', {
        shop_domain,
        title: blogPost.blog_post?.title?.substring(0, 50) + '...'
      });

      // For now, return a mock response
      // In production, you would make actual API calls to Shopify
      return {
        success: true,
        shopify_article_id: Math.floor(Math.random() * 1000000),
        published_url: `https://${shop_domain}/blogs/news/${blogPost.blog_post?.slug}`,
        message: 'Blog post published successfully to Shopify'
      };
    } catch (error) {
      logger.error('Error publishing to Shopify:', error);
      throw new Error('Failed to publish to Shopify');
    }
  }
}

module.exports = new AIService(); 