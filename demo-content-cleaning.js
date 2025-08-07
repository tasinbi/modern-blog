const { cleanSingleContent } = require('./bulk-content-cleaner');

// Example of problematic content that would come from WordPress
const problematicContent = `
<style>
.brutalist-button { 
  left: -100%; 
  transition: none; 
  opacity: 0; 
} 
@keyframes slide { 
  0% { left: -100%; } 
  100% { left: 100%; } 
}
</style>

<div class="content-wrapper" style="margin: 10px; color: red;">
  <span style="font-family: Arial;">
    &lt;strong&gt;IELTS Reading&lt;/strong&gt; এ &amp;nbsp; ৮+ স্কোর করার জন্য
  </span>
</div>

[caption id="attachment_123" align="aligncenter" width="300"]
<img src="ielts-tips.jpg" alt="IELTS Tips">
এই ছবিতে দেখুন IELTS এর টিপস
[/caption]

<p></p><p>&nbsp;</p>

প্রতিটি প্যাসেজের জন্য সময় ভাগ করে নিন। &quot;Time Management&quot; খুবই গুরুত্বপূর্ণ।

<br><br><br>

&amp;nbsp; ১. প্রথমে &lt;em&gt;skimming&lt;/em&gt; করুন
&amp;nbsp; ২. তারপর &lt;strong&gt;scanning&lt;/strong&gt; করুন  
&amp;nbsp; ৩. প্রশ্নগুলো ভালো করে পড়ুন

[gallery ids="1,2,3"]

<font face="Verdana" color="blue">
  এই পদ্ধতিগুলো অনুসরণ করলে আপনি অবশ্যই ভালো স্কোর পাবেন।
</font>

<script>
  console.log("This should be removed");
</script>

&lt;p&gt;শেষ কথা: নিয়মিত অনুশীলন করুন।&lt;/p&gt;
`;

async function demonstrateCleaning() {
  console.log('🧪 Content Cleaning Demonstration');
  console.log('==================================\n');

  console.log('📝 PROBLEMATIC CONTENT (Before Cleaning):');
  console.log('----------------------------------------');
  console.log(problematicContent);
  console.log('\n' + '='.repeat(60) + '\n');

  try {
    const cleanedContent = await cleanSingleContent(problematicContent);
    
    console.log('✨ CLEANED CONTENT (After Cleaning):');
    console.log('------------------------------------');
    console.log(cleanedContent);
    console.log('\n' + '='.repeat(60) + '\n');

    console.log('📊 CLEANING SUMMARY:');
    console.log('--------------------');
    console.log(`Original length: ${problematicContent.length} characters`);
    console.log(`Cleaned length: ${cleanedContent.length} characters`);
    console.log(`Reduction: ${((problematicContent.length - cleanedContent.length) / problematicContent.length * 100).toFixed(1)}%`);
    
    console.log('\n✅ ISSUES FIXED:');
    console.log('- ❌ Removed CSS styles and @keyframes');
    console.log('- ❌ Removed WordPress shortcodes [caption], [gallery]');
    console.log('- ❌ Removed JavaScript <script> tags');  
    console.log('- ❌ Removed HTML tags with style/class attributes');
    console.log('- ❌ Decoded HTML entities (&lt; &gt; &amp; &quot; &nbsp;)');
    console.log('- ❌ Removed empty paragraphs and excessive line breaks');
    console.log('- ❌ Removed <font> tags and inline styling');
    console.log('- ✅ Converted to clean, semantic HTML paragraphs');
    console.log('- ✅ Preserved Bengali text content');
    console.log('- ✅ Maintained readable formatting');

  } catch (error) {
    console.error('❌ Error during demonstration:', error.message);
  }
}

// Additional examples
const additionalExamples = [
  {
    name: "HTML Entities Example",
    content: "&lt;p&gt;IELTS &amp; PTE পরীক্ষার জন্য &quot;সেরা&quot; টিপস।&lt;/p&gt; &nbsp;&nbsp; &mdash; Banglay IELTS"
  },
  {
    name: "WordPress Shortcodes Example", 
    content: "[embed]https://youtube.com/watch?v=123[/embed] এই ভিডিওটি দেখুন [wp_custom_widget id=5] IELTS সম্পর্কে জানতে।"
  },
  {
    name: "Broken HTML Example",
    content: "<div><span style='color:red;'><font face='Arial'>IELTS Speaking</font></span> টেস্টে <p></p><br><br> ভালো করার উপায়</div>"
  }
];

async function runAdditionalExamples() {
  console.log('\n\n🔍 Additional Cleaning Examples');
  console.log('===============================\n');

  for (const example of additionalExamples) {
    console.log(`📌 ${example.name}:`);
    console.log('Before:', example.content);
    
    try {
      const cleaned = await cleanSingleContent(example.content);
      console.log('After:', cleaned);
    } catch (error) {
      console.log('Error:', error.message);
    }
    
    console.log('\n' + '-'.repeat(50) + '\n');
  }
}

// Run demonstrations
demonstrateCleaning().then(() => {
  return runAdditionalExamples();
});