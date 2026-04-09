<template>
  <view class="assessment-page">
    <NavBar title="风险测评" :show-back="true" />
    <view v-if="!submitted" class="questions">
      <view v-for="(q, idx) in questions" :key="idx" class="question-card">
        <text class="question-text">{{ idx + 1 }}. {{ q.question }}</text>
        <view v-for="(opt, oidx) in q.options" :key="oidx" class="option" :class="{ selected: answers[idx] === oidx }" @click="answers[idx] = oidx">
          <text class="option-text">{{ opt.label }}</text>
        </view>
      </view>
      <button class="submit-btn" @click="handleSubmit">提交测评</button>
    </view>
    <view v-else class="result-card">
      <text class="result-title">测评结果</text>
      <text class="result-score">得分: {{ result.score }}</text>
      <text class="result-level">风险等级: {{ levelText(result.riskLevel) }}</text>
      <button class="back-btn" @click="() => uni.navigateBack()">返回</button>
    </view>
  </view>
</template>

<script setup lang="ts">
/**
 * 风险测评页面
 * 5 道题目，根据得分自动评定风险等级
 */
import { ref, reactive } from 'vue';
import NavBar from '../../components/NavBar.vue';
import { post } from '../../utils/request';

const submitted = ref(false);
const result = ref({ score: 0, riskLevel: '' });
const answers = reactive<Record<number, number>>({});

const questions = [
  { question: '您的投资经验有多长？', options: [{ label: '无经验', score: 5 }, { label: '1-3年', score: 15 }, { label: '3年以上', score: 25 }] },
  { question: '您能承受的最大亏损比例？', options: [{ label: '10%以内', score: 5 }, { label: '10%-30%', score: 15 }, { label: '30%以上', score: 25 }] },
  { question: '您的主要投资目的？', options: [{ label: '保值', score: 5 }, { label: '稳健增值', score: 15 }, { label: '高回报', score: 25 }] },
  { question: '您的年收入范围？', options: [{ label: '20万以下', score: 5 }, { label: '20-50万', score: 10 }, { label: '50万以上', score: 15 }] },
  { question: '您对杠杆交易的了解程度？', options: [{ label: '不了解', score: 0 }, { label: '有所了解', score: 5 }, { label: '非常熟悉', score: 10 }] },
];

function levelText(level: string) {
  const map: Record<string, string> = { conservative: '保守型', moderate: '稳健型', aggressive: '进取型' };
  return map[level] || level;
}

async function handleSubmit() {
  const allAnswered = questions.every((_, idx) => answers[idx] !== undefined);
  if (!allAnswered) { uni.showToast({ title: '请回答所有问题', icon: 'none' }); return; }

  const answerData = questions.map((q, idx) => ({
    questionId: idx + 1,
    answer: q.options[answers[idx]].label,
    score: q.options[answers[idx]].score,
  }));

  try {
    result.value = await post('/api/mobile/risk/assessment', { answers: answerData });
    submitted.value = true;
  } catch { /* handled */ }
}
</script>

<style scoped>
.assessment-page { min-height: 100vh; background: #f0f4f8; }
.questions { padding: 16px; }
.question-card { background: #fff; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
.question-text { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; margin-bottom: 12px; }
.option { padding: 10px 14px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; }
.option.selected { border-color: #2563eb; background: rgba(37,99,235,0.05); }
.option-text { font-size: 14px; color: #333; }
.submit-btn { width: 100%; height: 48px; background: #2563eb; color: #fff; font-size: 16px; font-weight: 600; border-radius: 8px; border: none; margin-top: 16px; }
.result-card { margin: 24px 16px; background: #fff; border-radius: 12px; padding: 32px; text-align: center; }
.result-title { font-size: 20px; font-weight: bold; color: #1a1a1a; display: block; }
.result-score { font-size: 36px; font-weight: bold; color: #2563eb; display: block; margin: 16px 0 8px; }
.result-level { font-size: 16px; color: #666; display: block; }
.back-btn { width: 100%; height: 44px; background: #e5e7eb; color: #333; border-radius: 8px; border: none; margin-top: 24px; font-size: 15px; }
</style>
