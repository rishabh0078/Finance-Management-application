// AI Service for financial insights and suggestions
class AIService {
  constructor() {
    // Get API key from environment variable (Vite requires VITE_ prefix)
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    this.apiURL = import.meta.env.VITE_OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';
    // Default to a specific free model (openrouter/auto selects paid models)
    // Free models: mistralai/mistral-7b-instruct, meta-llama/llama-3-8b-instruct, openchat/openchat-3.5-0106
    this.model = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/mistral-7b-instruct';
    
    // Debug logging (only in development)
    if (import.meta.env.DEV) {
      console.log('AI Service Configuration:', {
        hasApiKey: !!this.apiKey,
        apiKeyLength: this.apiKey ? this.apiKey.length : 0,
        apiURL: this.apiURL,
        model: this.model,
        envVars: {
          VITE_OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY ? 'Set' : 'Not set',
          VITE_OPENROUTER_API_URL: import.meta.env.VITE_OPENROUTER_API_URL ? 'Set' : 'Not set',
          VITE_OPENROUTER_MODEL: import.meta.env.VITE_OPENROUTER_MODEL ? 'Set' : 'Not set'
        }
      });
    }
    
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found in environment variables. Please set VITE_OPENROUTER_API_KEY in your .env file');
    }
  }

  async getFinancialSuggestions(financialData, retryCount = 0) {
    try {
      // Check if API key is configured
      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env file');
      }

      const prompt = this.buildPrompt(financialData);
      
      // Fallback models if the current one fails (verified free models - NO openrouter/auto as it selects paid models)
      const fallbackModels = [
        'mistralai/mistral-7b-instruct',
        'meta-llama/llama-3-8b-instruct',
        'openchat/openchat-3.5-0106',
        'nousresearch/nous-capybara-7b',
        'gryphe/mythomax-l2-13b'
      ];
      
      // Use fallback model if retrying, otherwise use configured model
      // Filter out the current model from fallbacks to avoid duplicates
      const availableFallbacks = fallbackModels.filter(m => m !== this.model);
      const modelToUse = retryCount > 0 && retryCount <= availableFallbacks.length 
        ? availableFallbacks[retryCount - 1] 
        : this.model;
      
      // Build messages array - use simple format for free models
      const messages = [
        {
          role: 'user',
          content: prompt
        }
      ];
      
      const requestBody = {
        model: modelToUse,
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      };
      
      // Debug logging (only in development)
      if (import.meta.env.DEV) {
        console.log('AI API Request:', {
          url: this.apiURL,
          model: modelToUse,
          originalModel: this.model,
          retryCount: retryCount,
          hasApiKey: !!this.apiKey,
          messageCount: requestBody.messages.length
        });
      }
      
      const response = await fetch(this.apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Financial Management App'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        console.error('AI API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          fullError: JSON.stringify(errorData, null, 2),
          model: modelToUse,
          retryCount: retryCount
        });
        
        // Try fallback models if current model fails (verified free models - NO openrouter/auto as it selects paid models)
        const fallbackModels = [
          'mistralai/mistral-7b-instruct',
          'meta-llama/llama-3-8b-instruct',
          'openchat/openchat-3.5-0106',
          'nousresearch/nous-capybara-7b',
          'gryphe/mythomax-l2-13b'
        ];
        
        // Filter out the original model to avoid retrying it
        const availableFallbacks = fallbackModels.filter(m => m !== this.model);
        
        const isModelError = errorData.error?.message?.includes('preset') || 
                            errorData.error?.message?.includes('model') || 
                            errorData.error?.message?.includes('not found') || 
                            errorData.error?.message?.includes('not available') ||
                            errorData.error?.message?.includes('No endpoints found') ||
                            errorMessage.includes('Provider returned error') ||
                            errorMessage.includes('No endpoints found') ||
                            errorData.error?.type === 'provider_error';
        
        // Try fallback model if available
        if (isModelError && retryCount < availableFallbacks.length) {
          const nextModel = availableFallbacks[retryCount];
          console.log(`Model "${modelToUse}" failed, trying fallback model "${nextModel}"...`);
          return this.getFinancialSuggestions(financialData, retryCount + 1);
        }
        
        // If all models failed or it's not a model error, throw the error
        if (isModelError) {
          throw new Error(`All free models failed. Try setting VITE_OPENROUTER_MODEL in your .env file to one of these: ${fallbackModels.join(', ')}`);
        }
        
        throw new Error(`AI API error: ${errorMessage}`);
      }

      const data = await response.json();
      console.log('AI API Response:', data);
      
      // Check if a paid model was used (openrouter/auto sometimes selects paid models)
      if (data.model && (data.model.includes('gpt-4') || data.model.includes('gpt-5') || data.model.includes('claude'))) {
        console.warn(`Warning: Paid model "${data.model}" was used. Consider using a specific free model.`);
        // Still return the response, but log the warning
      }
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      
      if (data.error) {
        throw new Error(data.error.message || 'AI service returned an error');
      }
      
      throw new Error('Invalid response format from AI service');
    } catch (error) {
      console.error('AI Service Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide more user-friendly error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Network error: Please check your internet connection and try again.');
      }
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        throw new Error('Authentication failed: Invalid API key. Please check the configuration.');
      }
      
      if (error.message.includes('429')) {
        throw new Error('Rate limit exceeded: Please wait a moment and try again.');
      }
      
      if (error.message.includes('Insufficient credits') || error.message.includes('credits')) {
        throw new Error('Insufficient API credits: Your OpenRouter account needs credits to use the AI service. Please purchase credits at https://openrouter.ai/settings/credits or use a different API key with credits.');
      }
      
      if (error.message.includes('Provider returned error') || error.message.includes('Model error') || error.message.includes('No endpoints found')) {
        throw new Error('Model error: The selected AI model is not available or returned an error. Try using "openrouter/auto" (automatic model selection) or "mistralai/mistral-7b-instruct" in your .env file (VITE_OPENROUTER_MODEL).');
      }
      
      throw error;
    }
  }

  buildPrompt(financialData) {
    const {
      balance,
      budgets,
      recentTransactions,
      monthlySummary
    } = financialData;

    let prompt = `Analyze this financial data and provide ONE specific, actionable suggestion for saving money and improving financial health. Keep it short and concise (1-2 sentences maximum):\n\n`;

    // Balance information
    if (balance) {
      prompt += `Current Financial Status:\n`;
      prompt += `- Total Income: ₹${balance.income || 0}\n`;
      prompt += `- Total Expenses: ₹${balance.expense || 0}\n`;
      prompt += `- Current Balance: ₹${balance.balance || 0}\n`;
      
      if (balance.income > 0) {
        const savingsRate = ((balance.income - balance.expense) / balance.income * 100).toFixed(1);
        prompt += `- Savings Rate: ${savingsRate}%\n`;
      }
      prompt += `\n`;
    }

    // Budget information
    if (budgets && budgets.length > 0) {
      prompt += `Budget Information:\n`;
      budgets.forEach(budget => {
        const spent = budget.spentAmount || 0;
        const total = budget.budgetAmount || 0;
        const percentage = total > 0 ? ((spent / total) * 100).toFixed(1) : 0;
        prompt += `- ${budget.category}: ₹${spent} / ₹${total} (${percentage}% used)\n`;
      });
      prompt += `\n`;
    }

    // Recent transactions
    if (recentTransactions && recentTransactions.length > 0) {
      prompt += `Recent Expenses (last ${Math.min(5, recentTransactions.length)}):\n`;
      recentTransactions.slice(0, 5).forEach(transaction => {
        if (transaction.type === 'expense') {
          prompt += `- ${transaction.category}: ₹${transaction.amount} (${transaction.description})\n`;
        }
      });
      prompt += `\n`;
    }

    // Monthly summary
    if (monthlySummary) {
      prompt += `Monthly Summary:\n`;
      prompt += `- Monthly Income: ₹${monthlySummary.income || 0}\n`;
      prompt += `- Monthly Expenses: ₹${monthlySummary.expense || 0}\n`;
      prompt += `- Monthly Savings: ₹${monthlySummary.balance || 0}\n`;
      prompt += `\n`;
    }

    prompt += `\nBased on this financial data, provide ONE most important suggestion as a financial advisor. Focus on the most impactful action they can take right now. Keep it to 1-2 sentences only. Be practical and actionable. Do not use numbered lists or multiple suggestions - just one clear, concise suggestion.`;

    return prompt;
  }
}

export default new AIService();

