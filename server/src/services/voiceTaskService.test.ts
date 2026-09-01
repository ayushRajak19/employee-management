import assert from "node:assert/strict";
import test from "node:test";
import { detectVoiceHours, detectVoiceStatusIntent } from "./voiceTaskService.js";

test("completion intent is detected across supported Indian languages", () => {
  const examples = [
    "I completed the payroll report", "मैंने रिपोर्ट पूरी कर ली", "রিপোর্ট সম্পন্ন হয়েছে", "அறிக்கை முடிந்தது",
    "రిపోర్ట్ పూర్తయింది", "अहवाल पूर्ण केले", "રિપોર્ટ પૂર્ણ છે", "ವರದಿ ಪೂರ್ಣವಾಗಿದೆ", "റിപ്പോർട്ട് പൂർത്തിയായി",
    "ਰਿਪੋਰਟ ਮੁਕੰਮਲ ਹੋਇਆ", "رپورٹ مکمل ہو گئی"
  ];
  for (const example of examples) assert.equal(detectVoiceStatusIntent(example), "complete", example);
});

test("hours are extracted from multilingual number words", () => {
  assert.equal(detectVoiceHours("completed it in three hours"), 3);
  assert.equal(detectVoiceHours("तीन घंटे में पूरा किया"), 3);
  assert.equal(detectVoiceHours("மூன்று மணி நேரத்தில் முடித்தேன்"), 3);
});
