// The Richest Person in the Graveyard — all visitor-facing copy.
// Ported from the design handoff (app/data.js → window.RPG_DATA). Privacy and
// gate copy revised for the "unlock your full results" flow; final wording is
// still subject to IG compliance review (see [Final wording per IG compliance.]).

export const CONTENT = {
  landing: {
    headline: "Do you want to be the richest person in the graveyard?",
    subhead:
      "Most successful people never ask what their money is actually for. Twelve questions, three minutes, and you'll know where you stand.",
    // Revised: full results now require an email + a shared summary (see ResultScreen gate).
    supporting:
      "Your detailed answers compute in your browser. Three minutes to see where you stand — your full results and a tailored guide are one short step away.",
    cta: "Find out where I stand",
    attribution:
      "From Adam Malcolm, CFP, MFA-P, IG Wealth Management. Creator of the Strategic Generosity Blueprint™."
  },

  // 8 mindset questions. score: points used for intentionality.
  // excluded: true → answer not counted in normalisation.
  mindset: [
    {
      id: "q1",
      question: "When did you last ask yourself what your money is actually for?",
      answers: [
        { label: "It's a live question for me right now", score: 3 },
        { label: "Sometime in the past year", score: 2 },
        { label: "Years ago, maybe once", score: 1 },
        { label: "Never. The question feels new.", score: 0 }
      ]
    },
    {
      id: "q2",
      question: "Do you have a number for “enough”?",
      answers: [
        { label: "Yes, and I know what happens beyond it", score: 3 },
        { label: "Roughly. I could name a range.", score: 2 },
        { label: "No, the target keeps moving", score: 1 },
        { label: "I've never thought of it as a number", score: 0 }
      ]
    },
    {
      id: "q3",
      question:
        "If something happened to you tomorrow, would the people you love know what you intended?",
      answers: [
        { label: "Yes. We've talked about it and it's written down.", score: 3 },
        { label: "It's written down, but we haven't really talked", score: 2 },
        { label: "They'd have to guess", score: 1 },
        { label: "I'd rather not think about it", score: 0 }
      ]
    },
    {
      id: "q4",
      question: "Is your will the whole plan, or part of one?",
      answers: [
        { label: "Part of a bigger plan that gets reviewed", score: 3 },
        { label: "I have a current will and that's about it", score: 2 },
        { label: "My will is out of date", score: 1 },
        { label: "I don't have a will", score: 0 }
      ]
    },
    {
      id: "q5",
      question: "How does your giving happen today?",
      answers: [
        { label: "It's structured and built into my financial plan", score: 3 },
        { label: "Regular, but disconnected from the plan", score: 2 },
        { label: "Occasional, when something moves me", score: 1 },
        { label: "Someday, once I'm sure I have enough", score: 0 }
      ]
    },
    {
      id: "q6",
      question: "Do you spend on the things you love without guilt?",
      answers: [
        { label: "Yes, and I know exactly what those things are", score: 3 },
        { label: "Mostly, with the occasional wince", score: 2 },
        { label: "I keep deferring the good stuff to later", score: 1 },
        { label: "Spending makes me anxious, full stop", score: 0 }
      ]
    },
    {
      id: "q7",
      question: "Does your advisor talk to you about anything besides your investments?",
      answers: [
        { label: "Yes: tax, estate, insurance and giving all come up", score: 3 },
        { label: "Occasionally, when I raise it", score: 2 },
        { label: "Not really. It's mostly about returns.", score: 1 },
        { label: "I don't have an advisor", score: 0 }
      ]
    },
    {
      id: "q8",
      question: "Has the next generation ever been part of a money conversation with you?",
      answers: [
        { label: "Yes. They know the intentions and the why.", score: 3 },
        { label: "They know pieces of it", score: 2 },
        { label: "We've never had that conversation", score: 1 },
        { label: "Doesn't apply to me", score: 0, excluded: true }
      ]
    }
  ],

  bridge: {
    headline: "Now let's run your numbers.",
    body:
      "A few inputs and you'll see your wealth projected out in front of you, using the same planning assumptions Canadian financial planners use. The math happens right here in your browser. Your detailed numbers stay on your device — you choose later whether to share a short summary to unlock your full results.",
    cta: "Show me my projection"
  },

  calculator: {
    sectionLabel: "Your numbers",
    badge: "Educational illustration",
    inputs: [
      { id: "age", label: "Your age", kind: "number", min: 18, max: 90, step: 1, suffix: "years old" },
      {
        id: "retireAge",
        label: "When do you plan to stop working, or when did you?",
        kind: "number",
        min: 30,
        max: 90,
        step: 1,
        suffix: "years old"
      },
      {
        id: "province",
        label: "Where do you live?",
        kind: "province",
        helper: "Tax at death and probate differ by province."
      },
      {
        id: "rrsp",
        label: "RRSP or RRIF balance",
        kind: "currency",
        min: 0,
        max: 20000000,
        step: 25000,
        helper: "Taxed as income when it comes out, including all at once at death."
      },
      {
        id: "tfsa",
        label: "TFSA balance",
        kind: "currency",
        min: 0,
        max: 5000000,
        step: 10000,
        helper: "Tax-free, in life and at death."
      },
      {
        id: "nonreg",
        label: "Non-registered investments",
        kind: "currency",
        min: 0,
        max: 30000000,
        step: 25000,
        helper: "In this illustration, capital gains tax on these is estimated once, at death."
      },
      {
        id: "savings",
        label: "Roughly how much do you add each year while working?",
        kind: "currency",
        min: 0,
        max: 2000000,
        step: 5000,
        suffix: "per year"
      },
      {
        id: "spending",
        label: "What will you spend each year once you stop working?",
        kind: "currency",
        min: 0,
        max: 5000000,
        step: 5000,
        suffix: "per year, today's dollars"
      },
      { id: "style", label: "How is your money invested?", kind: "style" }
    ],
    // FP Canada 2026 PAG nominal returns before fees:
    // short term 2.4%, fixed income 3.2%, Cdn eq 6.3%, US eq 6.4%, intl dev 6.6%, EM 7.5%.
    // Real return shown to users = gross − fee − inflation (fee editable in drawer).
    styles: [
      {
        id: "cautious",
        name: "Cautious",
        blurb: "Steadier, slower.",
        mix: "10% short term, 70% fixed income, 20% Canadian equities",
        gross: 3.74
      },
      {
        id: "balanced",
        name: "Balanced",
        blurb: "A classic mix.",
        mix: "40% fixed income, 25% Canadian, 25% US, 10% international equities",
        gross: 5.12
      },
      {
        id: "growth",
        name: "Growth-oriented",
        blurb: "Bumpier, faster.",
        mix: "15% fixed income, 30% Canadian, 35% US, 20% international equities",
        gross: 5.93
      }
    ],
    inflation: 2.1, // FP Canada 2026 PAG
    feeDefault: 1.0, // Adam's decision, June 10, 2026; PAG range 0.5–2.5
    feeRange: { min: 0.5, max: 2.5, step: 0.1 },
    gainShareDefault: 50, // default unrealized gain share of non-registered at death, %
    retireTaxDefault: 25, // average income-tax rate on RRSP/RRIF withdrawals in retirement, %
    retireTaxRange: { min: 0, max: 55, step: 1 },
    defaults: {
      age: 50,
      retireAge: 65,
      province: "ON",
      rrsp: 400000,
      tfsa: 100000,
      nonreg: 250000,
      savings: 25000,
      spending: 80000,
      style: "balanced",
      feePct: 1.0,
      gainShare: 50,
      retireTax: 25
    },
    cta: "See where I stand",
    chart: {
      estateLabel: "Projected estate",
      craLabel: "Estimated CRA share if nothing changes",
      craCaption: "The CRA may be your largest unintended beneficiary.",
      depletedLabel: function (age) {
        return "Your wealth is projected to be fully used by age " + age + ".";
      },
      depletedNote: "That's not failure. That's money doing its job, funding a life.",
      disclaimer:
        "This is a simplified educational illustration, not financial advice and not a financial plan. It leaves out a great deal that matters. Results depend entirely on the assumptions shown, and your real numbers will differ. [Final wording per IG compliance.]"
    },
    assumptions: {
      title: "Assumptions",
      intro:
        "Every number below is part of the math. The fee and the unrealized-gain share are editable; the return style, your stop-working age and your province are assumptions too."
    },
    leavesOut: {
      title: "What this tool leaves out",
      intro: "Quite a lot, on purpose. This illustration does not include:",
      items: [
        "CPP, OAS and employer pensions",
        "Exact retirement tax brackets (we apply one average rate to RRSP/RRIF withdrawals)",
        "Tax on non-registered investment income during your lifetime (gains are estimated at death)",
        "RRIF minimum withdrawals",
        "Spousal rollovers and income splitting",
        "Your exact tax rate at death (we use the top marginal rate)",
        "Insurance, real estate and business assets",
        "Market ups and downs (we use one steady rate)",
        "And everything a conversation would surface"
      ],
      closing:
        "A real financial plan models all of this. This tool exists to start the conversation, not to finish it."
    }
  },

  results: {
    A: {
      name: "The richest person in the graveyard",
      leadSentence: function (estate, cra) {
        return (
          "Your projection says it plainly: on the current path, you die with " +
          estate +
          ", and the CRA takes an estimated " +
          cra +
          " of it."
        );
      },
      paragraph:
        "You're good at making money. That was never the question. But the plan for what all of it is for hasn't caught up, and if nothing changes, your wealth will likely outlive you. Someone else will decide what it meant. Here's the good news: you have the rarest problem in finance, more than enough, and every tool you need to turn it into something.",
      closing:
        "The question isn't whether you'll have enough. The question is what the rest is for.",
      opportunity:
        "Define your “enough” number. Everything beyond it becomes available for living and giving on purpose."
    },
    B: {
      name: "The waiting room",
      paragraph:
        "You know what your money is for. You've just been waiting for permission to act on it. I call this the generosity waiting room: the intention is real, the structure is missing, and “someday” keeps renewing itself. The shift from waiting to moving is smaller than you think, and it usually starts with one decision, not a windfall.",
      closing: "What would change if someday had a date on it?",
      opportunity:
        "Pick one intention and give it a structure this year: a date, an amount, or a vehicle."
    },
    C: {
      name: "The builder",
      paragraph:
        "You're in the building years, and the building is going well. The honest answer is that the graveyard question isn't urgent for you yet. But here's where most people go wrong: they wait for the complexity wall to hit before they start thinking about what the wealth is for. You get to start with the why already in place. That's an advantage almost nobody has.",
      closing: "What would you build differently if you knew what it was all for?",
      opportunity:
        "Watch for the complexity wall: new equity, a bigger role, a growing family. That's the moment planning starts paying for itself."
    },
    D: {
      name: "Generosity in motion",
      paragraph:
        "You've done the thing most people never do: connected your money to your intentions. Your wealth has a job, your family knows the plan, and generosity is already moving through it. So the work now isn't fixing anything. It's pressure-testing the plan, deepening the structure, and bringing the next generation into the room.",
      closing: "What would it take for this to outlast you?",
      opportunity:
        "Pressure-test the plan: would it still express your intentions if tax rules, family circumstances or markets shifted tomorrow?"
    }
  },

  resultTieIn:
    "If this picture made you stop, the next step is a real plan that does this properly.",

  // New: shown in the free teaser, under the profile name, to set up the gate.
  resultGateHook:
    "That's the recognition. The picture behind it — what you're on track to leave, the CRA's share, and what to do about it — is one step away.",

  // Gate (was the email-capture module). Now unlocks the full result.
  emailCapture: {
    heading: "Unlock your full results",
    body:
      "Enter your details to reveal your full projection, what it means for you, and your biggest opportunity — and I'll send a short guide of concrete next steps for people who land where you did.",
    consent:
      "Yes — show my full results and send the guide. I'm OK sharing my result and the investable-asset total I entered so Adam can tailor it. Unsubscribe anytime. [Final wording per IG compliance.]",
    button: "Show my full results"
  },

  thankYou: {
    heading: "It's on the way.",
    body:
      "Check your inbox in the next few minutes. And if your result raised a question you'd rather talk through with a person, that's what I'm here for.",
    cta: "Book a conversation, no agenda required."
  },

  // Shown when the guide email couldn't be sent but results were still unlocked.
  guideDelayedNote:
    "Your results are unlocked. The guide email may be delayed — if it doesn't arrive shortly, reach me at adam.malcolm@ig.ca.",

  footer: {
    disclaimer:
      "This tool is for education and reflection. It is not financial, tax or legal advice and it is not a financial plan. Projections are simplified illustrations based on the stated assumptions, not forecasts. [Final wording per IG compliance.]",
    preparedBy: "Prepared by Adam Malcolm, CFP, MFA-P, IG Wealth Management",
    // Revised: discloses exactly what leaves the device on unlock.
    privacy:
      "Your detailed answers and numbers are processed in your browser. To unlock your full results, your name, email, result profile and the investable-asset total you entered are sent to Adam Malcolm at IG Wealth Management. Nothing else leaves your device. [Final wording per IG compliance.]"
  }
};

export default CONTENT;
