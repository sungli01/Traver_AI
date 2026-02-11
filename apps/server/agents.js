const { Anthropic } = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Concierge Agent: 사용자의 요청을 분석하고 적절한 에이전트에게 전달
 */
async function processAgentRequest(message, context = []) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 2048,
      system: `당신은 Skywork Voyage Intelligence의 전문 Travel 에이전트입니다. 
      당신의 핵심 임무는 사용자가 제공하는 텍스트, 링크, 파일 내용을 분석하여 구조화된 '여행 일정표'를 만드는 것입니다.
      - 사용자가 자료를 던지면, 이를 분석하여 즉시 Day-by-Day 일정표를 제안하십시오.
      - 출력 시 가능한 경우 JSON 구조(id, title, destination, itinerary 등)를 포함하여 시스템이 시각화할 수 있게 하십시오.
      - 말투는 전문적이며 사용자 편의를 최우선으로 합니다.
      - Claude 3 Opus의 강력한 분석 능력을 활용하여 복잡한 예약 확인서나 여행 블로그 링크에서도 핵심 정보를 추출하십시오.`,
      messages: [
        ...context,
        { role: "user", content: message }
      ],
    });
    return response.content[0].text;
  } catch (error) {
    console.error("Agent Error:", error);
    return "요청을 처리하는 중 에이전트에 오류가 발생했습니다.";
  }
}

module.exports = { processAgentRequest };
