source 'https://rubygems.org'

# You may use http://rbenv.org/ or https://rvm.io/ to install and use this version
ruby ">= 2.6.10"

# Exclude problematic versions of cocoapods and activesupport that causes build failures.
gem 'cocoapods', '>= 1.15.2'
gem 'activesupport', '>= 6.1.7.5', '!= 7.1.0'
# xcodeproj 1.26+ supports Xcode 16 project format (version 70).
# CFPropertyList 3.0.9 is the last release supporting Ruby 2.6; xcodeproj
# 1.26+ requires >= 3.0.3 so the constraint is satisfiable on this Ruby.
gem 'xcodeproj', '>= 1.26.0'
gem 'CFPropertyList', '3.0.9'
gem 'concurrent-ruby', '< 1.3.4'

# Ruby 3.4.0 has removed some libraries from the standard library.
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'
gem 'nkf'
gem 'xcpretty'
