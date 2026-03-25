const axios = require('axios');

/**
 * Generate quiz questions using Grok AI
 * @param {string} courseTitle - The title of the course
 * @param {string} courseDescription - The description of the course
 * @param {string} category - The category of the course
 * @param {string} level - The difficulty level (Beginner, Intermediate, Advanced)
 * @param {Array} tags - Course tags for additional context
 * @param {number} questionCount - Number of questions to generate (default: 10)
 * @returns {Promise<Array>} Array of quiz questions
 */
async function generateQuizWithGrok(courseTitle, courseDescription, category, level = 'Beginner', tags = [], questionCount = 10) {
  try {
    // Check for API keys - prefer Groq (which is available)
    const groqApiKey = process.env.GROQ_API_KEY;
    const grokApiKey = process.env.GROK_API_KEY;
    
    let apiKey, apiEndpoint, modelName, apiName;
    
    if (groqApiKey) {
      // Use Groq API (fast and reliable)
      apiKey = groqApiKey;
      apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      modelName = 'llama-3.3-70b-versatile'; // Updated to current model
      apiName = 'Groq';
      console.log('Using Groq API for quiz generation');
    } else if (grokApiKey) {
      // Use Grok/X.AI API
      apiKey = grokApiKey;
      apiEndpoint = 'https://api.x.ai/v1/chat/completions';
      modelName = 'grok-2-latest'; // Updated model name
      apiName = 'Grok';
      console.log('Using Grok (X.AI) API for quiz generation');
    } else {
      console.warn('Neither GROQ_API_KEY nor GROK_API_KEY configured, using fallback quiz generation');
      return generateFallbackQuiz(courseTitle, courseDescription, category, level, tags, questionCount);
    }

    const tagsContext = tags.length > 0 ? `\nKey Topics: ${tags.join(', ')}` : '';
    
    const prompt = `You are an expert educator creating a comprehensive technical assessment quiz.

Course Information:
- Title: "${courseTitle}"
- Category: ${category}
- Level: ${level}
- Description: ${courseDescription}${tagsContext}

Create EXACTLY 10 multiple-choice questions with this specific breakdown:

**8 TECHNICAL QUESTIONS (Questions 1-8):**
- Test deep TECHNICAL understanding of ${courseTitle}
- Focus on concepts, syntax, implementation, and best practices
- Include code examples or technical scenarios where appropriate
- Test problem-solving and analytical skills
- Should be specific to the course content and ${category}
- Appropriate for ${level} level students

**2 REAL-WORLD APPLICATION QUESTIONS (Questions 9-10):**
- Focus on practical, real-world scenarios and use cases
- Test how to apply ${courseTitle} knowledge in professional settings
- Include business context, project scenarios, or industry applications
- Should demonstrate understanding of when and how to use the skills
- Focus on decision-making and practical implementation

Requirements for ALL questions:
- Clear, unambiguous correct answers
- 4 options where wrong answers are plausible but clearly incorrect
- Avoid generic questions that could apply to any course
- Difficulty should match ${level} level
- Each question should have a brief explanation

Return ONLY a valid JSON array in this exact format (no markdown, no explanation):
[
  {
    "question": "Technical question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct",
    "type": "technical"
  },
  ...8 technical questions...
  {
    "question": "Real-world scenario question?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct",
    "type": "real-world"
  },
  ...2 real-world questions...
]`;

    console.log(`\nGenerating quiz for: ${courseTitle}`);
    console.log(`Course description: ${courseDescription.substring(0, 100)}...`);
    console.log(`Using ${apiName} API: ${apiEndpoint}`);
    console.log(`Model: ${modelName}\n`);

    const response = await axios.post(
      apiEndpoint,
      {
        messages: [
          {
            role: 'system',
            content: 'You are an expert technical educator who creates high-quality, course-specific assessment questions. You always generate exactly 8 technical questions followed by 2 real-world application questions. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: modelName,
        temperature: 0.7,
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000 // 45 seconds timeout
      }
    );

    const content = response.data.choices[0].message.content;
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    const questions = JSON.parse(jsonStr);
    
    // Validate the response
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Invalid response format from AI API');
    }
    
    // Validate each question and ensure we have the right mix
    const validatedQuestions = questions.slice(0, 10).map((q, index) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctAnswer !== 'number') {
        throw new Error(`Invalid question format at index ${index}`);
      }
      
      // Auto-assign type based on position if not provided
      let questionType = q.type || (index < 8 ? 'technical' : 'real-world');
      
      return {
        question: q.question,
        options: q.options,
        correctAnswer: Math.min(Math.max(0, q.correctAnswer), 3), // Ensure 0-3 range
        explanation: q.explanation || 'Correct answer based on course material.',
        type: questionType
      };
    });
    
    // Count question types
    const technicalCount = validatedQuestions.filter(q => q.type === 'technical').length;
    const realWorldCount = validatedQuestions.filter(q => q.type === 'real-world').length;
    
    console.log(`✅ Successfully generated quiz using ${apiName} AI:`);
    console.log(`  - ${technicalCount} technical questions`);
    console.log(`  - ${realWorldCount} real-world questions`);
    console.log(`  - Total: ${validatedQuestions.length} questions\n`);
    
    return validatedQuestions;
    
  } catch (error) {
    console.error('❌ Error generating quiz with AI:', error.message);
    if (error.response) {
      console.error('AI API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    console.log('⚠️  Falling back to template-based quiz generation\n');
    return generateFallbackQuiz(courseTitle, courseDescription, category, level, tags, questionCount);
  }
}

/**
 * Fallback quiz generation when AI is not available
 * Generates 8 technical questions and 2 real-world questions
 */
function generateFallbackQuiz(courseTitle, courseDescription, category, level = 'Beginner', tags = [], questionCount = 10) {
  // Extract key terms from description and title
  const keyTerms = [...new Set([
    ...courseTitle.toLowerCase().split(' ').filter(w => w.length > 3),
    ...tags.map(t => t.toLowerCase())
  ])].slice(0, 5);

  // 8 Technical Questions
  const technicalQuestions = [
    {
      question: `What is the primary objective of ${courseTitle}?`,
      options: [
        `To master ${category} fundamentals and practical applications`,
        'To learn basic computer skills',
        'To understand general programming concepts',
        'To study database management only'
      ],
      correctAnswer: 0,
      explanation: `${courseTitle} focuses specifically on ${category} concepts and their practical applications.`,
      type: 'technical'
    },
    {
      question: `Which skill level is ${courseTitle} designed for?`,
      options: [
        level,
        level === 'Beginner' ? 'Advanced' : 'Beginner',
        level === 'Intermediate' ? 'Expert' : 'Intermediate',
        'All levels equally'
      ],
      correctAnswer: 0,
      explanation: `This course is specifically designed for ${level} level students.`,
      type: 'technical'
    },
    {
      question: `In the context of ${courseTitle}, what is the most important foundational concept?`,
      options: [
        `Understanding core ${category} principles and architecture`,
        'Memorizing syntax without understanding',
        'Installing software only',
        'Reading documentation without practice'
      ],
      correctAnswer: 0,
      explanation: `Core ${category} principles form the foundation of ${courseTitle}.`,
      type: 'technical'
    },
    {
      question: `What technical approach should you take when learning ${courseTitle}?`,
      options: [
        'Practice regularly with hands-on coding projects and exercises',
        'Only watch videos without practicing',
        'Skip difficult technical topics',
        'Memorize everything without understanding'
      ],
      correctAnswer: 0,
      explanation: 'Hands-on practice is essential for mastering any technical subject.',
      type: 'technical'
    },
    {
      question: `Which of the following best describes the technical scope of ${category}?`,
      options: [
        `A comprehensive field covering ${courseDescription.substring(0, 60)}...`,
        'A simple hobby with no technical depth',
        'An outdated technology with no modern applications',
        'Only for entertainment purposes'
      ],
      correctAnswer: 0,
      explanation: `${category} is a professional technical field with extensive real-world applications.`,
      type: 'technical'
    },
    {
      question: `What technical skill will you gain from completing ${courseTitle}?`,
      options: [
        `Practical ${category} implementation skills and problem-solving abilities`,
        'Just a certificate with no skills',
        'No real technical competencies',
        'Only theoretical knowledge'
      ],
      correctAnswer: 0,
      explanation: `Completing ${courseTitle} provides hands-on technical skills valuable in the ${category} field.`,
      type: 'technical'
    },
    {
      question: `What indicates technical mastery of ${courseTitle} concepts?`,
      options: [
        'Ability to solve complex problems independently and debug issues effectively',
        'Just completing all videos',
        'Having certificates on resume',
        'Memorizing all content verbatim'
      ],
      correctAnswer: 0,
      explanation: 'True technical mastery is demonstrated through independent problem-solving and debugging skills.',
      type: 'technical'
    },
    {
      question: `Which technical resource complements ${courseTitle} best?`,
      options: [
        `Official ${category} documentation, API references, and hands-on practice projects`,
        'Random blog posts without verification',
        'Unrelated courses from different fields',
        'Social media posts only'
      ],
      correctAnswer: 0,
      explanation: `Official documentation and practice projects are the best technical supplements for ${category} learning.`,
      type: 'technical'
    }
  ];

  // 2 Real-World Application Questions
  const realWorldQuestions = [
    {
      question: `In a real-world project scenario, how would you apply ${courseTitle} knowledge to solve business problems?`,
      options: [
        `Analyze requirements, design solutions using ${category} best practices, implement and test iteratively`,
        'Copy code from the internet without understanding',
        'Avoid planning and start coding randomly',
        'Use only theoretical knowledge without practical implementation'
      ],
      correctAnswer: 0,
      explanation: `Real-world ${category} projects require systematic analysis, design, implementation, and testing.`,
      type: 'real-world'
    },
    {
      question: `When working in a professional team on a ${category} project, what should you prioritize after completing ${courseTitle}?`,
      options: [
        `Collaborate effectively, write maintainable code, document solutions, and continue learning industry trends`,
        'Work in isolation without team communication',
        'Write code without documentation or comments',
        'Stop learning after course completion'
      ],
      correctAnswer: 0,
      explanation: `Professional ${category} work requires collaboration, maintainability, documentation, and continuous learning.`,
      type: 'real-world'
    }
  ];
  
  // Combine: 8 technical + 2 real-world = 10 questions
  const allQuestions = [...technicalQuestions, ...realWorldQuestions];
  
  console.log(`Generated fallback quiz: 8 technical + 2 real-world questions`);
  return allQuestions.slice(0, questionCount);
}

module.exports = {
  generateQuizWithGrok,
  generateFallbackQuiz
};
