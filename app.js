/* ================= AUDIO ENGINE ================= */
let actx=null;
function ctx(){ if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)(); if(actx.state==='suspended') actx.resume(); return actx; }
function freq(cents){ return 261.63 * Math.pow(2, cents/1200); }

function playNote(cents, delay, dur, gainVal){
  gainVal = gainVal || 0.24;
  const ac = ctx();
  const o1 = ac.createOscillator(); o1.type='sine';
  const o2 = ac.createOscillator(); o2.type='triangle'; o2.detune.value=5;
  const g1 = ac.createGain(); g1.gain.value=0.75;
  const g2 = ac.createGain(); g2.gain.value=0.35;
  const master = ac.createGain();
  o1.frequency.value=freq(cents); o2.frequency.value=freq(cents);
  o1.connect(g1); o2.connect(g2); g1.connect(master); g2.connect(master);
  master.connect(ac.destination);
  const now = ac.currentTime+delay;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(gainVal, now+0.035);
  master.gain.exponentialRampToValueAtTime(0.0001, now+dur);
  o1.start(now); o2.start(now);
  o1.stop(now+dur+0.05); o2.stop(now+dur+0.05);
  return now;
}

function playScaleSeq(centsArr, opts){
  opts = opts||{};
  const noteDur = opts.noteDur || 0.42;
  const onBead = opts.onBead;
  const full = opts.roundTrip ? centsArr.concat(centsArr.slice(0,-1).reverse()) : centsArr;
  full.forEach((c,i)=>{
    playNote(c, i*noteDur, noteDur*0.92);
    if(onBead) setTimeout(()=>onBead(i % centsArr.length), i*noteDur*1000);
  });
  return full.length*noteDur;
}

function dum(delay){
  const ac=ctx(); const o=ac.createOscillator(); o.type='sine';
  const g=ac.createGain();
  o.connect(g); g.connect(ac.destination);
  const now=ac.currentTime+delay;
  o.frequency.setValueAtTime(105, now);
  o.frequency.exponentialRampToValueAtTime(42, now+0.26);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.7, now+0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now+0.3);
  o.start(now); o.stop(now+0.32);
}
function tak(delay, soft){
  const ac=ctx();
  const bufSize = Math.floor(ac.sampleRate*0.045);
  const buf = ac.createBuffer(1,bufSize, ac.sampleRate);
  const d = buf.getChannelData(0);
  for(let i=0;i<bufSize;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/bufSize,2);
  const src = ac.createBufferSource(); src.buffer=buf;
  const filt = ac.createBiquadFilter(); filt.type='highpass'; filt.frequency.value= soft?1800:3000;
  const g = ac.createGain(); g.gain.value= soft?0.28:0.55;
  src.connect(filt); filt.connect(g); g.connect(ac.destination);
  src.start(ac.currentTime+delay);
}

/* ================= DATA ================= */
const BASICS = [
 {id:'rast', name:'الرست', jinsLen:4, root:'الرست (دو تقريباً)', mood:'مهيب، متوازن، مُشرق — يُعدّ «أبو المقامات»', jins:'جنس الرست: تون + ¾ + ¾', signature:'النغمة المميزة: الدرجة الثالثة نصف مُنخفضة (بين الفا والمي)، وهي «نغمة الزمزمة» التي تمنحه طابعه الخاص ولا وجود لها في السلم الغربي.',
   cents:[0,200,350,500,700,900,1050,1200]},
 {id:'bayati', name:'البيات', jinsLen:4, root:'الدوكاه (ري تقريباً)', mood:'حنون، دافئ — الأكثر شيوعاً في الإنشاد والمدائح والمواويل الشعبية', jins:'جنس البيات: ¾ + ¾ + تون', signature:'يبدأ بخطوتين متتاليتين من ثلاثة أرباع الصوت، فيعطي إحساساً بالتحيّر اللطيف في أول درجتين.',
   cents:[0,150,300,500,700,850,1000,1200]},
 {id:'sikah', name:'السيكاه', jinsLen:3, root:'السيكاه (بين مي ومي بيمول)', mood:'رقيق، عاطفي — قرار المقام نفسه ربع صوت، وهذا نادر', jins:'جنس السيكاه: ¾ + تون (ثلاثي الدرجات)', signature:'درجة قراره أصلاً ربع صوت، لذلك يصعب عزفه على آلات السلم الغربي الثابت، وهو مفتاح مقامات الهزام والعراق.',
   cents:[0,150,350,550,700,850,1000,1200]},
 {id:'saba', name:'الصبا', jinsLen:4, root:'الدوكاه (ري تقريباً)', mood:'حزين، باكٍ — مقام الرثاء والدعاء والابتهال', jins:'جنس الصبا: ¾ + ¾ + ¾ (ثلاث خطوات متتالية من ربع الصوت)', signature:'ثلاث خطوات متتالية من ثلاثة أرباع الصوت تُنتج رابعة صغيرة غريبة الوقع — أكثر ما يميّزه سماعياً عن كل المقامات الأخرى.',
   cents:[0,150,300,450,650,800,1000,1200]},
 {id:'hijaz', name:'الحجاز', jinsLen:4, root:'الدوكاه (ري تقريباً)', mood:'صحراوي، خشوعي — الأكثر ارتباطاً بالمديح النبوي', jins:'جنس الحجاز: نصف + تون ونصف (ثانية زائدة) + نصف', signature:'الثانية الزائدة بين الدرجتين الثانية والثالثة (كأنها «قفزة») هي بصمته التي يعرفها كل أذن عربية فوراً.',
   cents:[0,100,400,500,700,800,1000,1200]},
 {id:'nahawand', name:'النهاوند', jinsLen:4, root:'الدوكاه (ري تقريباً)', mood:'قريب من السلم الغربي الصغير (الأقلية الهارمونية)، حزين رزين', jins:'جنس النهاوند: تون + نصف + تون', signature:'الدرجة السابعة ترتفع صعوداً كأنها نغمة توتر تحل على القرار — تماماً كالسلم الصغير الهارموني الغربي.',
   cents:[0,200,300,500,700,800,1100,1200]},
 {id:'kurd', name:'الكرد', jinsLen:4, root:'الدوكاه (ري تقريباً)', mood:'بسيط، شعبي — أقرب سلالمنا لمقام «فريجي» الغربي', jins:'جنس الكرد: نصف + تون + تون', signature:'الدرجة الثانية منخفضة نصف درجة مباشرة بعد القرار، فيعطي إحساساً حاداً من أول نغمتين.',
   cents:[0,100,300,500,600,800,1000,1200]},
 {id:'ajam', name:'العجم', jinsLen:4, root:'عجم عشيران (سي بيمول تقريباً)', mood:'فرح، مشرق — يطابق السلم الكبير (الماجير) الغربي تماماً', jins:'جنس العجم: تون + تون + نصف', signature:'المقام الوحيد بين الثمانية الذي لا يحوي أي ربع صوت — ولهذا يبدو «مألوفاً» لأذن معتادة على الموسيقى الغربية.',
   cents:[0,200,400,500,700,900,1000,1200]},
];

// أمثلة إسلامية بحتة لكل مقام (لا أغاني دنيوية): "composed" أناشيد ملحّنة موزونة بإيقاع،
// و"free" أناشيد/ابتهالات/مواويل دينية غير ملحّنة (حرة الإيقاع). التصنيف المقامي اجتهادي غير موثّق أكاديمياً.
const NASHEED = {
 rast:{ composed:[{t:'كثير من أناشيد المديح ذات الطابع الاحتفالي المهيب',w:'الرست يمنحها وقاراً وثباتاً'},{t:'أناشيد افتتاح المناسبات الدينية الرسمية',w:'شائع في المدرسة الإنشادية المصرية'}], free:[{t:'تلاوات ومقدمات الشيخ محمد رفعت',w:'اشتهر بتمكّنه من مقام الرست في القرآن'},{t:'الأذان التقليدي بالطريقة المصرية',w:'غالباً ما يُؤدى على درجة الرست'}]},
 bayati:{ composed:[{t:'طلع البدر علينا (اللحن التراثي المتوارث)',w:'من أشهر الأمثلة التعليمية لأجواء البيات'},{t:'كثير من قصائد المديح النبوي الشعبية',w:'لسهولة أدائه الجماعي ودفء طابعه'}], free:[{t:'المواويل الدينية والابتهالات الشعبية عموماً',w:'البيات الأكثر استخداماً في الموال الديني'}]},
 sikah:{ composed:[{t:'نادر أن يظهر مباشرة في الإنشاد الموزون',w:'يظهر أكثر عبر فرعيه (الهزام والعراق)'}], free:[{t:'بعض الابتهالات النادرة ذات الطابع الرقيق جداً',w:'قرار ربع الصوت يجعله صعب الأداء الجماعي'}]},
 saba:{ composed:[{t:'أناشيد الرثاء والمناسبات الحزينة الموزونة',w:'نادرة نسبياً لصعوبة الطرب الجماعي به'}], free:[{t:'ابتهال مولاي إني ببابك',w:'سيد النقشبندي، ألحان بليغ حمدي — طابعه الحزين قريب من أجواء الصبا'},{t:'أدعية القنوت والابتهالات الحزينة عموماً',w:'الصبا هو مقام الرثاء والدعاء بامتياز'}]},
 hijaz:{ composed:[{t:'قصائد المديح النبوي الحجازي على إيقاع السامري',w:'الحجاز هو الطابع الغالب على هذا الفن'},{t:'أناشيد فرق الإنشاد الحجازية التقليدية (المسحباني)',w:'موزونة وراقصة'}], free:[{t:'تلاوات بعض القراء المجودين',w:'كالشيخ سعد الغامدي وفق مصادر متخصصة بالمقامات'},{t:'الأذان بالطريقة الحجازية',w:'يميل كثيراً لطابع الحجاز الخاشع'}]},
 nahawand:{ composed:[{t:'كثير من الأناشيد المعاصرة ذات اللمسة الغربية',w:'لقربه من السلم الصغير الهارموني المألوف للأذن الحديثة'}], free:[{t:'بعض الابتهالات الرزينة الهادئة',w:'طابعه حزين لكن غير حادّ كالصبا'}]},
 kurd:{ composed:[{t:'أقل ظهوراً في الإنشاد الديني المباشر',w:'أقرب لطابع فلكلوري بسيط'}], free:[]},
 ajam:{ composed:[{t:'كثير من الأناشيد الاحتفالية الحديثة (بالأورج والفرق الشبابية)',w:'لقربه التام من السلم الكبير الغربي المألوف'}], free:[]},
};
function ytUrl(q){ return 'https://www.youtube.com/results?search_query='+encodeURIComponent(q); }

const COUNTRIES = {
 sham:{ name:'بلاد الشام', intro:'الشام موطن القدود الحلبية والموشحات، حيث تُصاغ الألحان بعناية أكاديمية دقيقة. الغالب فيها مقامات البيات والنهاوند والحجاز، مع ولع خاص بتلوين اللحن عبر الانتقال (التحويل) بين أكثر من مقام داخل القطعة الواحدة.',
  branches:[
   {name:'بيات شوري', from:'فرع من البيات', desc:'يخفض الدرجة الخامسة قليلاً فيمنح البيات طابعاً أكثر شجناً، شائع في الدبكات والقدود الحلبية البطيئة.', ex:['القدود الحلبية الدينية، وموشحات المديح الشامية المتداولة تحت وسم «قدود حلبية»']},
   {name:'حجازكار كبير', from:'فرع من الحجاز', desc:'يركّب جنس حجاز في القرار وجنس حجاز آخر في أعلى السلم، فيتكرر «القفز» المميز مرتين ويكسب اللحن مهابة إضافية.', ex:['يستخدم في الإنشاد الديني المُهيب والافتتاحيات قبل القصائد']},
   {name:'هزام', from:'فرع من السيكاه', desc:'من أعذب فروع السيكاه وأكثرها انتشاراً في الشام، دافئ رومانسي، وسبب تسميته «الهزام» ارتباطه بموشح شهير بهذا الاسم.', ex:['يظهر في بعض قصائد المديح الحلبية العاطفية']},
  ]},
 yemen:{ name:'اليمن', intro:'الغناء اليمني — وأشهره الغناء الصنعاني المصحوب بآلة القنبوس أو العود اليمني — لا يلتزم تماماً بنظام أرباع الصوت الشرقي المعياري؛ له سلّمه الخاص القريب من مزيج بين طابعي البيات والحجاز، بفواصل صوتية دقيقة تختلف قليلاً عن الشرق العربي، وهو مسجّل في تراث اليونسكو غير المادي.', branches:[
   {name:'المقام الصنعاني', from:'سلّم يمني خاص، أقرب لمزيج بيات/حجاز', desc:'يُؤدَّى غالباً بحرّية إيقاعية ("موال") قبل الدخول في اللحن الموزون، وله معتمد نغمي مختلف عن ضبط الآلات الشرقية المعيارية.', ex:['الأناشيد والمدائح الدينية الصنعانية — يمكن البحث عنها باسم «فن الغناء الصنعاني» لتمييز طابعه الخاص']},
   {name:'الطابع اللحجي/الحضرمي', from:'أقرب إلى نهاوند/عجم', desc:'ألحان الساحل الجنوبي والحضرمي أقرب سماعياً للسلالم الكبيرة والصغيرة المعتادة، وأخف في استخدام ربع الصوت من الطابع الصنعاني الجبلي.', ex:['المدائح الدينية اللحجية والحضرمية التراثية']},
  ]},
 hijaz:{ name:'الحجاز', intro:'يُقصد هنا إقليم الحجاز في الجزيرة العربية (مكة والمدينة)، وليس مقام «الحجاز» الموسيقي وإن كان الاسم واحداً. الفن الحجازي (كالسامري) يستخدم مقامي الحجاز والبيات والنهاوند بكثرة، مع إيقاعات نابضة مميزة.', branches:[
   {name:'الحجاز في المديح النبوي الحجازي', from:'مقام الحجاز أساساً', desc:'الإنشاد المكي والمدني التقليدي يعتمد مقام الحجاز بشكل كثيف لما فيه من خشوع، غالباً مصحوباً بإيقاع السامري.', ex:['قصائد المديح النبوي التي تُؤدَّى على إيقاع السامري في الحجاز']},
   {name:'حجاز نهاوند', from:'مزيج حجاز + نهاوند', desc:'انتقال شائع في الفن الحجازي: يبدأ اللحن بجنس حجاز في القرار ثم يتحول لطابع نهاوند في الجزء العلوي من السلم.', ex:['شائع في المسحباني والمدائح الشعبية الحجازية']},
  ]},
 egypt:{ name:'مصر', intro:'المدرسة المصرية هي التي فرّعت المقامات الأساسية أكاديمياً إلى عشرات الفروع الدقيقة، ووثّقتها في معاهد الموسيقى العربية، وانعكس ذلك على الإنشاد الديني المصري أيضاً.', branches:[
   {name:'سوزناك', from:'فرع من الرست', desc:'يضيف جنس حجاز فوق جنس الرست، فيمنحه بريقاً احتفالياً أكثر تألقاً من الرست الأصلي.', ex:['شائع في افتتاحيات الموالد والمدائح المصرية الاحتفالية']},
   {name:'صبا دلنشين', from:'فرع من الصبا', desc:'يضيف جنس نهاوند في الجزء العلوي من سلّم الصبا، فيلطّف حدّة الحزن قليلاً بلمسة رزينة بدل الانكسار الكامل.', ex:['يظهر كثيراً في القصائد الدينية والابتهالات المصرية الطويلة']},
   {name:'نهاوند مرصّع', from:'فرع من النهاوند', desc:'«مرصّع» أي مُزيَّن — تلوينات وتحويلات سريعة داخل جسد مقام النهاوند نفسه أثناء الارتجال.', ex:['شائع في تقاسيم الآلات المصاحبة للابتهالات الدينية']},
   {name:'عراق (على السيكاه)', from:'فرع من السيكاه', desc:'من أرقّ فروع السيكاه، فرع مصري الاستخدام بامتياز.', ex:['بعض الابتهالات العاطفية المصرية الرقيقة']},
  ]},
 iraq:{ name:'العراق', intro:'«المقام العراقي» ليس مجرد لحن بل منظومة فنية متكاملة مسجّلة في قائمة اليونسكو للتراث الثقافي غير المادي، تضم نحو خمسين مقاماً مسمّى يؤدّيها «القارئ» مصحوباً بالجالغي البغدادي (سنطور، جوزة، طبلة، رِق).', branches:[
   {name:'البيات (المقام العراقي)', from:'ضمن منظومة المقام العراقي', desc:'من أوسع المقامات العراقية انتشاراً وأكثرها مرونة في تفريعاتها الداخلية.', ex:['أداء القرّاء التقليديين للمقام العراقي — يمكن البحث بوسم «مقام عراقي بيات»']},
   {name:'الحجاز ديوان', from:'ضمن منظومة المقام العراقي', desc:'صياغة عراقية خاصة لطابع الحجاز، أكثر تعقيداً في مساراتها من حجاز المشرق العربي العام.', ex:['من المقامات العراقية المعروفة بصعوبة أدائها']},
   {name:'اللامي، الأورفة، المخالف', from:'مقامات عراقية أصيلة لا نظير مباشر لها خارج العراق', desc:'أسماء لمقامات بمسارات لحنية خاصة بالتقليد العراقي وحده، تُظهر ثراء المنظومة العراقية المستقلة.', ex:['يُدرَّس ضمن سلسلة المقام العراقي الكاملة في المعاهد العراقية المتخصصة']},
  ]},
 maghreb:{ name:'المغرب العربي', intro:'الموسيقى الأندلسية-المغاربية (النوبة في المغرب، المالوف في الجزائر وتونس وليبيا) لها نظام مقامي خاص يُسمّى «الطبع»، وليس مطابقاً حرفياً لمصطلحات المشرق، وإن تقاطع معها في الجذور التاريخية.', branches:[
   {name:'رمل الماية', from:'طبع أندلسي مغربي', desc:'من أشهر طبوع النوبة الأندلسية المغربية، أقرب سماعياً لطابع الرست/النهاوند الممزوج، هادئ ومهيب.', ex:['المدائح الدينية المغربية على طبع رمل الماية']},
   {name:'الحجاز الكبير (المغربي)', from:'طبع أندلسي مغربي', desc:'نسخة مغاربية من طابع الحجاز، تُستخدم في افتتاحيات نوبات كاملة تمتد ساعات.', ex:['المدائح الدينية في افتتاحيات نوبة الحجاز الكبير']},
   {name:'الأصبهان', from:'طبع أندلسي مالوفي/مغربي', desc:'مشترك بين المالوف التونسي والجزائري والنوبة المغربية، بلمسة شجن مميزة عن باقي الطبوع.', ex:['المدائح الدينية في المالوف التونسي والجزائري على طبع الأصبهان']},
  ]},
};

const RHYTHMS = [
 {name:'المقسوم', region:'الأكثر انتشاراً في كل المشرق العربي، 4/4', desc:'الإيقاع الأشيع في الإنشاد الديني عموماً، متوسط السرعة ومرن.', pattern:['dum','tak','rest','tak','dum','rest','tak','rest']},
 {name:'البلدي', region:'مصر، 4/4', desc:'أثقل قليلاً من المقسوم، نبضه أوضح وأثقل.', pattern:['dum','tak','tak','rest','dum','rest','tak','rest']},
 {name:'المصمودي الكبير', region:'مشرقي عام، 4/4 بطيء وواسع', desc:'إيقاع مهيب بطيء، يُستخدم في افتتاحيات القصائد الدينية الطويلة.', pattern:['dum','dum','rest','tak','dum','dum','rest','tak']},
 {name:'الوحدة الكبيرة', region:'مشرقي عام، بطيء جداً وفخم', desc:'أبطأ الإيقاعات وأكثرها اتساعاً، يمنح مساحة كبيرة للتطريب والارتجال الصوتي.', pattern:['dum','rest','rest','rest','tak','rest','rest','rest']},
 {name:'السماعي ثقيل', region:'مشرقي كلاسيكي، 10/8', desc:'من الإيقاعات المركّبة العريقة في الموسيقى العربية الكلاسيكية والموشحات الدينية الرصينة.', pattern:['dum','rest','tak','dum','rest','dum','rest','tak','rest','rest']},
 {name:'السامري', region:'شائع في الحجاز، سريع نابض', desc:'إيقاع فلكلوري حجازي حيوي مصاحب لفن السامري والمديح الحجازي.', pattern:['dum','tak','dum','tak','rest','tak','rest','tak']},
 {name:'الدارج', region:'من مراحل النوبة الأندلسية المغاربية', desc:'إحدى مراحل الإيقاع المتصاعدة في النوبة، أسرع من البطايحي الذي يسبقه.', pattern:['dum','tak','rest','dum','tak','rest']},
];

const MAWWALS = [
 {region:'مصر', name:'الموّال البلدي (الفلاحي)', maqam:'saba', desc:'ارتجال حرّ خارج الميزان تماماً، يتكئ غالباً على مقامي الصبا أو البيات، ويشتهر بتكرار كلمة واحدة بأشكال لغوية متعددة (الموال السباعي) قبل أن يدخل المؤدي في اللحن الموزون.'},
 {region:'الحجاز', name:'الموّال الحجازي', maqam:'hijaz', desc:'يفتتح كثيراً من قصائد المديح والسامري، ارتجال حرّ على مقام الحجاز يمهّد الأذن للحن الموزون القادم.'},
 {region:'الشام', name:'الموّال الحلبي', maqam:'nahawand', desc:'يظهر ضمن جلسات القدود كمقدمة ارتجالية غنية بالزخارف الصوتية، وغالباً يمهّد للانتقال بين أكثر من مقام.'},
 {region:'العراق', name:'الموّال البغدادي (ضمن التحرير)', maqam:'bayati', desc:'جزء أصيل من بنية «المقام العراقي» نفسه، يُعرف باسم «التحرير»، ويتطلب تحكماً دقيقاً بربع الصوت وتطريزاً صوتياً معقداً.'},
 {region:'اليمن', name:'الموّال الصنعاني', maqam:'bayati', desc:'مقدمة حرة تسبق الأغنية الصنعانية الموزونة، تتبع السلّم اليمني الخاص أكثر من قواعد المقام الشرقي المعياري.'},
 {region:'المغرب العربي', name:'الاستخبار', maqam:'ajam', desc:'مقابل الموّال في المالوف والنوبة الأندلسية: ارتجال حرّ منفرد يفتتح كل نوبة قبل الدخول في مراحلها الموزونة المتصاعدة.'},
];

/* ================= PROGRESS (localStorage) ================= */
const STORAGE_KEY = 'maqamat-learned-v1';
function loadLearned(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); } catch(e){ return {}; }
}
function saveLearned(obj){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch(e){ /* ignore */ }
}
let learned = loadLearned();
function updateProgressPill(){
  const count = BASICS.filter(m=>learned[m.id]).length;
  const el1 = document.getElementById('progress-count');
  if(el1) el1.textContent = count+' / '+BASICS.length;
  const ring = document.getElementById('progress-ring-fg');
  if(ring){
    const circumference = 2*Math.PI*10;
    const pct = count/BASICS.length;
    ring.style.strokeDasharray = circumference.toFixed(2);
    ring.style.strokeDashoffset = (circumference*(1-pct)).toFixed(2);
  }
}

/* ================= RENDER ================= */
const TABS = [
 {id:'basics', label:'المقامات الأساسية'},
 {id:'countries', label:'الفروع حسب البلد'},
 {id:'rhythms', label:'الإيقاعات'},
 {id:'mawwal', label:'المواويل'},
 {id:'quiz', label:'اختبار الأذن'},
 {id:'sing', label:'غنِّ لي 🎤'},
];

function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }

function renderTabs(){
  const wrap = document.getElementById('tabs');
  TABS.forEach((t,i)=>{
    const b = el('button','tab-btn'+(i===0?' active':''), t.label);
    b.setAttribute('role','tab');
    b.onclick = ()=>{
      document.querySelectorAll('.tab-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('panel-'+t.id).classList.add('active');
    };
    wrap.appendChild(b);
  });
}

function beadStrand(cents, prefix){
  const strand = el('div','strand');
  cents.forEach((c,i)=>{
    if(i>0) strand.appendChild(el('div','wire'));
    const b = el('div','bead', String(i+1));
    b.id = prefix+'-bead-'+i;
    b.title = 'استمع لهذه الدرجة';
    b.onclick = ()=> playNote(c,0,0.6);
    strand.appendChild(b);
  });
  return strand;
}

function playScaleWithBeads(cents, prefix, btn){
  if(btn){ btn.disabled=true; setTimeout(()=>btn.disabled=false, cents.length*2*420+300); }
  const total = playScaleSeq(cents, {noteDur:0.42, roundTrip:true, onBead:(idx)=>{
    for(let i=0;i<cents.length;i++){
      const el2 = document.getElementById(prefix+'-bead-'+i);
      if(el2) el2.classList.toggle('playing', i===idx);
    }
  }});
  setTimeout(()=>{ for(let i=0;i<cents.length;i++){ const el2=document.getElementById(prefix+'-bead-'+i); if(el2) el2.classList.remove('playing'); } }, total*1000+50);
}

function renderBasics(){
  const panel = el('div','panel active'); panel.id='panel-basics';
  panel.appendChild(el('p','section-intro','ثمانية مقامات، كل واحد منها «جذر» تتفرّع منه عشرات المقامات الأخرى. استمع لجنس كل مقام أولاً (أول ٣-٤ درجات) فهو ما يحدّد شخصيته، ثم للسلّم كاملاً.'));
  const grid = el('div','grid');
  BASICS.forEach((m,i)=>{
    const card = el('div','card'+(learned[m.id]?' learned':''));
    card.id = 'card-'+m.id;
    card.appendChild(el('div','lesson-badge','الدرس '+(i+1)));
    card.appendChild(el('h3', null, m.name+' <span class="tag">'+m.jins.split(':')[0]+'</span>'));
    card.appendChild(el('p','sub', m.mood));
    const keyRow = el('div','key-row');
    keyRow.innerHTML = '<span><b>درجة القرار:</b> '+m.root+'</span><span><b>بنية الجنس:</b> '+m.jins+'</span>';
    card.appendChild(keyRow);
    card.appendChild(beadStrand(m.cents, m.id));
    card.appendChild(el('p','desc', m.signature));
    const btns = el('div','btnrow');
    const playBtn = el('button','play-btn','▶ استمع للسلّم كاملاً');
    playBtn.onclick = ()=>playScaleWithBeads(m.cents, m.id, playBtn);
    const jinsBtn = el('button','play-btn alt','▶ الجنس فقط (المفتاح)');
    jinsBtn.onclick = ()=> playScaleWithBeads(m.cents.slice(0,m.jinsLen), m.id, jinsBtn);
    const learnBtn = el('button','play-btn ghost learn-btn', learned[m.id] ? '✓ تعلمتها' : 'وضعها كمتعلَّمة');
    learnBtn.onclick = ()=>{
      learned[m.id] = !learned[m.id];
      saveLearned(learned);
      card.classList.toggle('learned', !!learned[m.id]);
      learnBtn.textContent = learned[m.id] ? '✓ تعلمتها' : 'وضعها كمتعلَّمة';
      updateProgressPill();
    };
    btns.appendChild(playBtn); btns.appendChild(jinsBtn); btns.appendChild(learnBtn);
    card.appendChild(btns);

    const nd = NASHEED[m.id];
    if(nd){
      const exBox = el('div','examples');
      const row = (x)=> '<div class="ex-item"><span><span class="ex-txt">'+x.t+'</span> — <span class="ex-who">'+x.w+'</span></span><a class="yt-link" target="_blank" rel="noopener" href="'+ytUrl(x.t)+'">▶ يوتيوب</a></div>';
      const empty = '<div class="ex-item"><span class="ex-txt">لا أمثلة شائعة كافية بهذا المقام مباشرة</span></div>';
      exBox.innerHTML =
          '<div class="ex-group"><span class="ex-title">أناشيد إسلامية ملحّنة (موزونة)</span>'+(nd.composed.length? nd.composed.map(row).join('') : empty)+'</div>'
        + '<div class="ex-group" style="margin-top:10px"><span class="ex-title">أناشيد وابتهالات غير ملحّنة (حرة الإيقاع)</span>'+(nd.free.length? nd.free.map(row).join('') : empty)+'</div>'
        + '<div class="hedge">تصنيف الأناشيد مقامياً اجتهادي غير موثّق أكاديمياً — تحقق بأذنك بمقارنتها بجنس المقام أعلاه.</div>';
      card.appendChild(exBox);
    }

    grid.appendChild(card);
  });
  panel.appendChild(grid);
  document.getElementById('panels').appendChild(panel);
}

function renderCountries(){
  const panel = el('div','panel'); panel.id='panel-countries';
  const subtabs = el('div','subtabs');
  const holder = el('div');
  let first=true;
  Object.keys(COUNTRIES).forEach(key=>{
    const c = COUNTRIES[key];
    const btn = el('button','subtab-btn'+(first?' active':''), c.name);
    btn.onclick=()=>{
      document.querySelectorAll('.subtab-btn').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.country-panel').forEach(p=>p.classList.remove('active'));
      document.getElementById('country-'+key).classList.add('active');
    };
    subtabs.appendChild(btn);

    const cp = el('div','country-panel'+(first?' active':'')); cp.id='country-'+key;
    cp.appendChild(el('div','country-intro', c.intro));
    c.branches.forEach((b,bi)=>{
      const bd = el('div','branch');
      bd.appendChild(el('h4', null, b.name));
      bd.appendChild(el('div','from', b.from));
      bd.appendChild(el('p','desc', b.desc));
      const exBox = el('div','examples');
      exBox.innerHTML = '<b>أمثلة للاستئناس السمعي:</b><ul style="margin:6px 0 0;padding-inline-start:18px">'+b.ex.map(x=>'<li style="margin:3px 0">'+x+'</li>').join('')+'</ul>';
      bd.appendChild(exBox);
      const parent = BASICS.find(m=> b.from.includes(m.name)) ;
      if(parent){
        const pb = el('button','play-btn alt','▶ استمع لجنس '+parent.name+' الأصلي كمرجع');
        pb.onclick = ()=> playScaleWithBeads(parent.cents.slice(0, parent.jinsLen), 'ref-'+key+'-'+bi, pb);
        bd.appendChild(pb);
        bd.appendChild(beadStrand(parent.cents.slice(0, parent.jinsLen), 'ref-'+key+'-'+bi));
      }
      cp.appendChild(bd);
    });
    holder.appendChild(cp);
    first=false;
  });
  panel.appendChild(subtabs);
  panel.appendChild(holder);
  document.getElementById('panels').appendChild(panel);
}

function renderRhythms(){
  const panel = el('div','panel'); panel.id='panel-rhythms';
  RHYTHMS.forEach((r,ri)=>{
    const card = el('div','iqa-card');
    card.appendChild(el('h3', null, r.name));
    card.appendChild(el('p','region', r.region));
    card.appendChild(el('p','desc', r.desc));
    const beatsWrap = el('div','beats');
    r.pattern.forEach((p,i)=>{
      const b = el('div','beat '+p, p==='dum'?'دم':(p==='tak'?'تك':''));
      b.id='iqa-'+ri+'-'+i;
      beatsWrap.appendChild(b);
    });
    card.appendChild(beatsWrap);
    const btn = el('button','play-btn','▶ شغّل الإيقاع (٣ دورات)');
    btn.onclick = ()=>{
      btn.disabled=true;
      const stepDur = 0.34;
      let t=0;
      for(let loop=0; loop<3; loop++){
        r.pattern.forEach((p,i)=>{
          const delay=t;
          if(p==='dum') dum(delay); else if(p==='tak') tak(delay, false);
          setTimeout(()=>{
            document.querySelectorAll('#panel-rhythms .beat').forEach(x=>x.classList.remove('hit'));
            const el2=document.getElementById('iqa-'+ri+'-'+i);
            if(el2) el2.classList.add('hit');
          }, delay*1000);
          t+=stepDur;
        });
      }
      setTimeout(()=>{ btn.disabled=false; document.querySelectorAll('#panel-rhythms .beat').forEach(x=>x.classList.remove('hit')); }, t*1000+200);
    };
    card.appendChild(btn);
    panel.appendChild(card);
  });
  document.getElementById('panels').appendChild(panel);
}

function renderMawwal(){
  const panel = el('div','panel'); panel.id='panel-mawwal';
  panel.appendChild(el('p','section-intro','الموّال غناء ارتجالي حرّ خارج الميزان الإيقاعي، يُظهر مهارة المؤدي في التلوّن داخل المقام قبل الدخول في اللحن الموزون. لكل منطقة نكهتها الخاصة في الموّال الديني:'));
  MAWWALS.forEach(mw=>{
    const card = el('div','mawwal-card');
    card.appendChild(el('h3', null, mw.name+' <span class="tag">'+mw.region+'</span>'));
    card.appendChild(el('p','desc', mw.desc));
    const parent = BASICS.find(m=>m.id===mw.maqam);
    if(parent){
      const btn = el('button','play-btn alt','▶ استمع لمقام '+parent.name+' المرتبط بهذا الموّال');
      btn.onclick=()=>playScaleWithBeads(parent.cents, 'mw-'+mw.name.replace(/\s+/g,''), btn);
      card.appendChild(btn);
    }
    panel.appendChild(card);
  });
  document.getElementById('panels').appendChild(panel);
}

/* ================= QUIZ ================= */
let quizState = {score:0, total:0, current:null};
function renderQuiz(){
  const panel = el('div','panel'); panel.id='panel-quiz';
  const box = el('div','quiz-box');
  box.innerHTML = '<h3 style="margin-top:0">تدرّب على تمييز المقامات بأذنك</h3><p class="quiz-score" id="quiz-score">النتيجة: 0 / 0</p><button class="play-btn" id="quiz-play">▶ استمع لمقام عشوائي</button><div class="quiz-opts" id="quiz-opts"></div><div class="quiz-feedback" id="quiz-fb"></div>';
  panel.appendChild(box);
  document.getElementById('panels').appendChild(panel);
  document.getElementById('quiz-play').onclick = nextQuizRound;
}
function nextQuizRound(){
  const correct = BASICS[Math.floor(Math.random()*BASICS.length)];
  quizState.current = correct;
  document.getElementById('quiz-fb').textContent='';
  playScaleSeq(correct.cents, {noteDur:0.42});
  const pool = BASICS.filter(m=>m.id!==correct.id);
  const opts = [correct];
  while(opts.length<4 && pool.length){
    const idx = Math.floor(Math.random()*pool.length);
    opts.push(pool.splice(idx,1)[0]);
  }
  opts.sort(()=>Math.random()-0.5);
  const optsWrap = document.getElementById('quiz-opts');
  optsWrap.innerHTML='';
  opts.forEach(o=>{
    const b = el('button','opt-btn', o.name);
    b.onclick = ()=>{
      quizState.total++;
      const fb = document.getElementById('quiz-fb');
      if(o.id===correct.id){
        quizState.score++;
        b.classList.add('correct');
        fb.textContent = 'صحيح! هذا مقام '+correct.name+'.';
        fb.style.color = 'var(--good)';
      } else {
        b.classList.add('wrong');
        fb.textContent = 'غير دقيق — كان المقام هو '+correct.name+'.';
        fb.style.color = 'var(--terracotta)';
      }
      document.querySelectorAll('#quiz-opts .opt-btn').forEach(x=>x.disabled=true);
      document.getElementById('quiz-score').textContent = 'النتيجة: '+quizState.score+' / '+quizState.total;
    };
    optsWrap.appendChild(b);
  });
}

/* ================= SING TEST (pitch detection) ================= */
function autoCorrelate(buf, sampleRate){
  const SIZE = buf.length;
  let rms = 0;
  for(let i=0;i<SIZE;i++) rms += buf[i]*buf[i];
  rms = Math.sqrt(rms/SIZE);
  if(rms < 0.01) return -1; // too quiet
  let r1=0, r2=SIZE-1;
  const thres = 0.2;
  for(let i=0;i<SIZE/2;i++){ if(Math.abs(buf[i])<thres){ r1=i; break; } }
  for(let i=1;i<SIZE/2;i++){ if(Math.abs(buf[SIZE-i])<thres){ r2=SIZE-i; break; } }
  const trimmed = buf.slice(r1,r2);
  const SIZE2 = trimmed.length;
  if(SIZE2<8) return -1;
  const c = new Array(SIZE2).fill(0);
  for(let i=0;i<SIZE2;i++){
    for(let j=0;j<SIZE2-i;j++) c[i]+= trimmed[j]*trimmed[j+i];
  }
  let d=0; while(d<SIZE2-1 && c[d]>c[d+1]) d++;
  let maxval=-1, maxpos=-1;
  for(let i=d;i<SIZE2;i++){ if(c[i]>maxval){ maxval=c[i]; maxpos=i; } }
  let T0 = maxpos;
  if(T0<=0) return -1;
  const x1=c[T0-1]!==undefined?c[T0-1]:c[T0], x2=c[T0], x3=c[T0+1]!==undefined?c[T0+1]:c[T0];
  const a=(x1+x3-2*x2)/2, b=(x3-x1)/2;
  if(a) T0 = T0 - b/(2*a);
  const freqOut = sampleRate/T0;
  if(freqOut<50 || freqOut>1200) return -1;
  return freqOut;
}

let singRunning=false;
function renderSing(){
  const panel = el('div','panel'); panel.id='panel-sing';
  const box = el('div','sing-box');
  box.innerHTML = '<h3 style="margin-top:0">غنِّ نغمات المقام وسأخمّن اسمه</h3>'
    + '<p class="desc" style="max-width:52ch;margin-inline:auto">غنِّ أو دندن صعوداً من درجة القرار حتى أعلى نغمة تعرفها ثم انزل بها مرة أخرى، في مكان هادئ وقريباً من الميكروفون، لمدة ٦ ثوانٍ.</p>'
    + '<button class="mic-btn" id="mic-btn">🎤 ابدأ التسجيل (٦ ثوانٍ)</button>'
    + '<div class="sing-status" id="sing-status"></div>'
    + '<div class="pitch-live" id="pitch-live"></div>'
    + '<div class="sing-results" id="sing-results"></div>';
  panel.appendChild(box);
  document.getElementById('panels').appendChild(panel);
  document.getElementById('mic-btn').onclick = startSingTest;
}

async function startSingTest(){
  if(singRunning) return;
  const btn = document.getElementById('mic-btn');
  const statusEl = document.getElementById('sing-status');
  const liveEl = document.getElementById('pitch-live');
  const resultsEl = document.getElementById('sing-results');
  resultsEl.innerHTML='';
  liveEl.textContent='';
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    statusEl.textContent = 'هذا المتصفح لا يدعم الوصول إلى الميكروفون، أو أن الصفحة لا تُعرض عبر HTTPS (مطلوب لعمل الميكروفون).';
    return;
  }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true}});
    singRunning = true;
    btn.disabled = true; btn.classList.add('rec'); btn.textContent='🔴 يسجّل الآن...';
    const ac = ctx();
    const src = ac.createMediaStreamSource(stream);
    const analyser = ac.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const samples = [];
    const durationMs = 6000;
    const startTime = performance.now();
    statusEl.textContent = 'استمع... دندن نغمات المقام الآن';
    function tick(){
      analyser.getFloatTimeDomainData(buf);
      const f = autoCorrelate(buf, ac.sampleRate);
      if(f>0){
        samples.push(f);
        liveEl.textContent = 'النغمة الحالية: ≈ '+f.toFixed(0)+' هرتز';
      }
      const elapsed = performance.now()-startTime;
      if(elapsed < durationMs){
        requestAnimationFrame(tick);
      } else {
        stream.getTracks().forEach(t=>t.stop());
        singRunning = false;
        btn.disabled = false; btn.classList.remove('rec'); btn.textContent='🎤 حاول مرة أخرى';
        liveEl.textContent='';
        analyzeSingResult(samples, statusEl, resultsEl);
      }
    }
    requestAnimationFrame(tick);
  } catch(err){
    singRunning = false;
    btn.disabled = false; btn.classList.remove('rec'); btn.textContent='🎤 ابدأ التسجيل (٦ ثوانٍ)';
    if(err && err.name==='NotAllowedError'){
      statusEl.textContent = 'رُفض إذن الميكروفون. اسمح به من إعدادات المتصفح لهذا الموقع ثم أعد المحاولة.';
    } else if(err && err.name==='NotFoundError'){
      statusEl.textContent = 'لم يُعثر على ميكروفون متاح على هذا الجهاز.';
    } else {
      statusEl.textContent = 'تعذّر الوصول إلى الميكروفون (قد تحتاج الصفحة أن تُعرض عبر HTTPS). جرّب فتحها من رابط GitHub Pages بدل فتحها كملف محلي.';
    }
  }
}

function analyzeSingResult(samples, statusEl, resultsEl){
  if(samples.length < 8){
    statusEl.textContent = 'لم يصل صوت كافٍ وواضح. جرّب الاقتراب من الميكروفون والغناء بصوت أعلى قليلاً في مكان هادئ.';
    return;
  }
  const centsAll = samples.map(f=> 1200*Math.log2(f/261.63));
  let bestTonic = centsAll[0], bestCount=-1;
  centsAll.forEach(c=>{
    const count = centsAll.filter(x=>Math.abs(x-c)<35).length;
    if(count>bestCount){ bestCount=count; bestTonic=c; }
  });
  const bins = new Array(48).fill(0); // 1200/25=48
  centsAll.forEach(c=>{
    let rel = (c - bestTonic) % 1200;
    if(rel<0) rel+=1200;
    const idx = Math.min(47, Math.round(rel/25));
    bins[idx%48]+=1;
  });
  const maxBin = Math.max(...bins,1);
  function densityAt(cents){
    const idx = Math.round(((cents%1200)+1200)%1200/25)%48;
    let best=0;
    for(let d=-1; d<=1; d++){ best = Math.max(best, bins[(idx+d+48)%48]); }
    return best/maxBin;
  }
  const scores = BASICS.map(m=>{
    const degrees = m.cents.slice(0,-1);
    const s = degrees.reduce((acc,c)=>acc+densityAt(c),0)/degrees.length;
    return {m, score:s};
  }).sort((a,b)=>b.score-a.score);
  const totalScore = scores.reduce((a,b)=>a+b.score,0) || 1;
  statusEl.textContent = 'أقرب تخمين بناءً على النغمات التي التقطتها (تقدير تقريبي وليس اختباراً معتمداً):';
  resultsEl.innerHTML = scores.slice(0,4).map(s=>{
    const pct = Math.round(100*s.score/totalScore);
    return '<div class="result-row"><div class="rr-top"><b>'+s.m.name+'</b><span>'+pct+'%</span></div><div class="result-bar-bg"><div class="result-bar-fill" style="width:'+pct+'%"></div></div></div>';
  }).join('');
}

/* ================= INIT ================= */
renderTabs();
renderBasics();
renderCountries();
renderRhythms();
renderMawwal();
renderQuiz();
renderSing();
updateProgressPill();
