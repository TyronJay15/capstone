import { CHATBOT_KNOWLEDGE, CHATBOT_WELCOME } from '../data/chatbotKnowledge';

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getChatbotWelcome() {
  return CHATBOT_WELCOME;
}

export function getChatbotReply(userMessage, { role } = {}) {
  const query = normalize(userMessage);
  if (!query) {
    return 'Please type a question or select one of the suggested topics.';
  }

  let best = null;
  let bestScore = 0;

  for (const entry of CHATBOT_KNOWLEDGE) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const kw = normalize(keyword);
      if (query.includes(kw)) score += kw.split(' ').length + 2;
      else if (kw.split(' ').some((word) => word.length > 3 && query.includes(word))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore >= 2) {
    let answer = best.answer.replace(/\*\*(.*?)\*\*/g, '$1');
    if (role === 'parent' && best.id === 'login-help') {
      answer += ' As a parent, use your registered parent email and your child’s LRN.';
    }
    return answer;
  }

  if (query.includes('hello') || query.includes('hi') || query.includes('help')) {
    return CHATBOT_WELCOME;
  }

  return (
    'I can help with account creation, enrollment steps, login, password recovery, enrollment statuses, sections, and profile updates. ' +
    'Try asking: "How do I create an account?" or "What does pending enrollment mean?"'
  );
}

/** Hook point for future AI API integration */
export async function getChatbotReplyAsync(message, context) {
  return getChatbotReply(message, context);
}
