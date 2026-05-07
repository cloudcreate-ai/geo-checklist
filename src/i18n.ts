export type Locale = 'en' | 'zh';

const messages: Record<Locale, Record<string, string>> = {
  en: {
    // Audit phases
    audit_start: 'Auditing {url}',
    fetching_html: 'Fetching page HTML...',
    page_fetched: 'Page fetched (HTTP {status}, {loadTimeMs}ms)',
    fetching_robots: 'Fetching robots.txt...',
    robots_found: 'robots.txt found',
    robots_not_found: 'robots.txt not found',
    fetching_sitemap: 'Fetching sitemap...',
    sitemap_found: 'sitemap found',
    sitemap_not_found: 'sitemap not found',
    launching_browser: 'Launching browser (Chromium)...',
    loading_page: 'Loading page...',
    browser_rendered: 'Browser page rendered: {url}',
    browser_failed: 'Browser rendering failed, using static HTML',
    running_static_checks: 'Running {count} static checks...',
    running_browser_checks: 'Running browser checks...',
    closing_browser: 'Closing browser',
    generating_report: 'Generating report...',
    // Check-specific progress
    check_32_crawling: '[3.2] Crawling internal pages, analyzing intent...',
    check_32_collected: 'Collected {count} internal links, will crawl up to {max}',
    check_32_crawled: 'Crawled {count} internal pages',
    check_33_duplicate: '[3.3] Checking for duplicate content across pages...',
    check_33_ok: 'No duplicate content detected',
    check_33_found: 'Found {count} potential duplicate pair(s)',
    check_127_entity: '[12.7] Checking entity naming consistency across pages...',
    check_34_dates: '[3.4] Extracting page dates (content freshness)...',
    check_52_links: '[5.2] Checking internal links for broken URLs...',
    check_52_broken: 'Found {count} broken link(s)',
    check_52_ok: 'No broken links',
    check_53_redirects: '[5.3] Checking link redirect chains...',
    check_53_found: 'Found {count} redirect chain(s)',
    check_53_ok: 'No redirect chains',
    check_63_mobile: '[6.3] Testing mobile responsive layout...',
    check_64_overlay: '[6.4] Detecting intrusive overlays/interstitials...',
    check_66_404: '[6.6] Testing 404 page...',
    check_113_captcha: '[11.3] Detecting CAPTCHA/bot-detection...',
    crawl_depth: '--- Depth {depth} ---',
    crawling_page: '[{n}] Fetching {url}',
    crawl_failed: '→ Page fetch failed, skipping',
    fast_skipped: 'Skipping browser checks (--fast mode)',
    // Intent types
    intent_informational: 'Informational',
    intent_howto: 'How-to / Tutorial',
    intent_comparison: 'Comparison',
    intent_question: 'Q&A / FAQ',
    intent_commercial: 'Commercial / Transactional',
    intent_coverage: '{covered}/{total} intent types covered: {details}',
    intent_missing: 'Missing content types: {types}',
    // Report markdown
    report_title: 'Geo-Checklist SEO & GEO Audit',
    report_url: 'URL',
    report_time: 'Time',
    report_score: 'Score',
    report_load: 'Load time',
    report_status: 'Status code',
    report_checks: 'Checks total',
    report_passed: 'passed',
    report_failed: 'failed',
    report_info: 'info',
    report_summary: 'Summary',
    report_fix_priority: 'Fix Priority Summary',
    report_fix_now: 'Fix Immediately',
    report_optimize: 'Suggested Optimization',
    report_action: 'Action',
    status_pass: '✅ PASS',
    status_fail: '❌ FAIL',
    status_info: 'ℹ️ INFO',
    // AdSense audit phases
    adsense_audit_start: 'Running AdSense compliance audit for {url}',
    adsense_running_checks: 'Running {count} AdSense checks...',
    adsense_running_browser: 'Running AdSense browser checks...',
    adsense_generating_report: 'Generating AdSense report...',
    // AdSense check progress
    adsense_check_a2: '[A.2] Analyzing template content ratio...',
    adsense_check_a3: '[A.3] Checking content originality...',
    adsense_check_a7: '[A.7] Checking cookie/privacy consent...',
    adsense_check_a9: '[A.9] Site-wide directory similarity analysis...',
    // AdSense report
    adsense_report_title: 'AdSense Compliance Audit Report',
    adsense_gate_label: 'Gate Status',
    adsense_gate_ok: '✅ All gate checks passed',
    adsense_gate_fail: '❌ Gate checks failed — AdSense rejection risk',
    adsense_gate_warning: 'Gate checks failed. AdSense is likely to reject this site.',
    report_critical: 'Critical Checks',
    report_warning: 'Warnings',
    report_info_title: 'Informational',
  },
  zh: {
    // Audit phases
    audit_start: '开始审计 {url}',
    fetching_html: '抓取页面 HTML...',
    page_fetched: '页面已抓取 (HTTP {status}, {loadTimeMs}ms)',
    fetching_robots: '获取 robots.txt...',
    robots_found: 'robots.txt 已找到',
    robots_not_found: 'robots.txt 未找到',
    fetching_sitemap: '获取 sitemap...',
    sitemap_found: 'sitemap 已找到',
    sitemap_not_found: 'sitemap 未找到',
    launching_browser: '启动浏览器 (Chromium)...',
    loading_page: '页面加载中...',
    browser_rendered: '浏览器页面已渲染: {url}',
    browser_failed: '浏览器渲染失败，使用静态 HTML',
    running_static_checks: '运行 {count} 项静态检查...',
    running_browser_checks: '运行浏览器检查...',
    closing_browser: '关闭浏览器',
    generating_report: '生成报告...',
    // Check-specific progress
    check_32_crawling: '[3.2] 爬取内部页面，分析内容意图...',
    check_32_collected: '发现 {count} 个内部链接，最多爬取 {max} 页',
    check_32_crawled: '已爬取 {count} 个内部页面',
    check_33_duplicate: '[3.3] 检查跨页面内容重复度...',
    check_33_ok: '未发现重复内容',
    check_33_found: '发现 {count} 组疑似重复页面',
    check_127_entity: '[12.7] 检查跨页面实体命名一致性...',
    check_34_dates: '[3.4] 提取页面日期（内容时效性）...',
    check_52_links: '[5.2] 检查内部链接是否损坏...',
    check_52_broken: '发现 {count} 个损坏链接',
    check_52_ok: '无损坏链接',
    check_53_redirects: '[5.3] 检查链接重定向链...',
    check_53_found: '发现 {count} 条重定向链',
    check_53_ok: '无重定向链',
    check_63_mobile: '[6.3] 测试移动端响应式布局...',
    check_64_overlay: '[6.4] 检测弹窗/遮罩层...',
    check_66_404: '[6.6] 测试 404 页面...',
    check_113_captcha: '[11.3] 检测 CAPTCHA/机器人验证...',
    crawl_depth: '--- 深度 {depth} ---',
    crawling_page: '[{n}] 抓取 {url}',
    crawl_failed: '页面抓取失败，跳过',
    fast_skipped: '跳过浏览器检查（--fast 模式）',
    // Intent types
    intent_informational: '信息型',
    intent_howto: '操作型',
    intent_comparison: '比较型',
    intent_question: '问答型',
    intent_commercial: '商业/交易',
    intent_coverage: '{covered}/{total} 意图类型覆盖: {details}',
    intent_missing: '缺少内容类型: {types}',
    // Report markdown
    report_title: 'Geo-Checklist SEO & GEO 审计',
    report_url: '网址',
    report_time: '时间',
    report_score: '总分',
    report_load: '加载时间',
    report_status: '状态码',
    report_checks: '检查总数',
    report_passed: '通过',
    report_failed: '失败',
    report_info: '信息',
    report_summary: '小结',
    report_fix_priority: '修复优先级总结',
    report_fix_now: '立即修复',
    report_optimize: '建议优化',
    report_action: '操作',
    status_pass: '✅ 通过',
    status_fail: '❌ 失败',
    status_info: '⏭️ 信息',
    // AdSense audit phases
    adsense_audit_start: '开始 AdSense 合规审计 {url}',
    adsense_running_checks: '运行 {count} 项 AdSense 检查...',
    adsense_running_browser: '运行 AdSense 浏览器检查...',
    adsense_generating_report: '生成 AdSense 报告...',
    // AdSense check progress
    adsense_check_a2: '[A.2] 分析模板内容占比...',
    adsense_check_a3: '[A.3] 检查内容原创度...',
    adsense_check_a7: '[A.7] 检查 Cookie/隐私同意机制...',
    adsense_check_a9: '[A.9] 全站目录相似度分析...',
    // AdSense report
    adsense_report_title: 'AdSense 合规审计报告',
    adsense_gate_label: '门槛检查状态',
    adsense_gate_ok: '✅ 全部通过',
    adsense_gate_fail: '❌ 未通过 — AdSense 拒绝风险',
    adsense_gate_warning: '门槛检查未通过，AdSense 很可能会拒绝此站点。',
    report_critical: '关键检查',
    report_warning: '警告',
    report_info_title: '信息',
  },
};

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function t(key: string): string {
  return messages[currentLocale]?.[key] ?? messages.en[key] ?? key;
}

export function tf(key: string, vars: Record<string, string | number>): string {
  let result = t(key);
  for (const [k, v] of Object.entries(vars)) {
    result = result.replace(`{${k}}`, String(v));
  }
  return result;
}

export const intentTypesLabel: Record<string, string> = {
  informational: 'intent_informational',
  howto: 'intent_howto',
  comparison: 'intent_comparison',
  question: 'intent_question',
  commercial: 'intent_commercial',
};
