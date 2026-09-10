from pathlib import Path

path = Path("src/lib/support-sites/templates.ts")
text = path.read_text()
replacements = {
    'businessName: "EazyTool Support"': 'businessName: "Apple Support"',
    'EazyTool services': 'Apple products and services',
    'Receipt Generator": "AI Automation", "Websites", "Image Tools", "Account", "Billing"': 'iPhone", "Mac", "iPad", "Apple Watch", "AirPods", "Apple TV"',
    '"How to create a receipt"': '"Forgot your Apple ID password"',
    '"Manage your subscription"': '"Manage Apple subscriptions"',
    '"Find your saved projects"': '"Find your Apple devices"',
    '"Contact the support team"': '"Get personalized support"',
    'businessName: "EazyTool"': 'businessName: "Binance Support"',
    'learn about EazyTool features': 'learn about Binance features',
    'EazyTool account': 'Binance account',
    'How do I manage my plan?': 'What are Binance trading fees?',
    'businessName: "EazyTool Help"': 'businessName: "Bitcoin.com Support"',
    'EazyTool account safety': 'Bitcoin.com account safety',
    'Creating your EazyTool account': 'Getting started with Bitcoin.com',
    'How to use the Receipt Generator': 'How to use the Bitcoin.com Wallet',
    'Which tools are included in my plan?': 'How do I buy Bitcoin?',
    'businessName: "EazyTool Global"': 'businessName: "BYD Support"',
    'EazyTool team': 'BYD support team',
    'EazyTool Company Limited': 'BYD Company Limited',
    'businessName: "EazyTool"': 'businessName: "Bitso Support"',
    'Search our help center or open a chat with an expert.': 'Search the Bitso help center or open a chat with an expert.',
    'How to use EazyTool': 'How to use Bitso',
    'How do I access my tools?': 'How do I access my Bitso account?',
    'businessName: "EazyTool Knowledge Base"': 'businessName: "Changelly Knowledge Base"',
    'EazyTool support guide': 'Changelly support guide',
    'What is EazyTool?': 'What is Changelly?',
    'What is EazyTool?': 'What is Changelly?',
    'businessName: "EazyTool Support"': 'businessName: "Cash App Support"',
    'EazyTool account': 'Cash App account',
    'businessName: "EazyTool Support Center"': 'businessName: "Blockchain.com Support Center"',
    'EazyTool Support Center': 'Blockchain.com Support Center',
    'EazyTool Account': 'Blockchain.com Account',
    'How to use the Receipt Generator': 'How to use the Blockchain.com Wallet',
    'What is the difference between plans?': 'What is the difference between a Wallet and Trading Account?',
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text)

path = Path("src/components/support-sites/support-site-preview.tsx")
text = path.read_text()
replacements = {
    'EazyTool Global': 'BYD Global',
    'EazyTool Company Limited': 'BYD Company Limited',
    'EazyTool Knowledge Base': 'Changelly Knowledge Base',
    'Start a chat in your EazyTool account for fast support.': 'Start a chat in your Cash App account for fast support.',
    'Learn how to use EazyTool {category.toLowerCase()}.': 'Learn how to use Bitcoin.com {category.toLowerCase()}.',
    'EazyTool Workspace': 'Blockchain.com Wallet',
    'Manage your account, tools, and subscription.': 'Manage your Blockchain.com wallet and trading account.',
    'Keep your EazyTool account protected.': 'Keep your Blockchain.com account protected.',
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text)
