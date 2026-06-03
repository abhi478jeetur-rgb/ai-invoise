Write-Host "Starting Escalation Load Test on localhost:3000..."

Write-Host "Test 1: 100 Users"
npx --yes autocannon -c 100 -d 5 http://localhost:3000 > testing_observations/test_100.txt 2>&1

Write-Host "Test 2: 200 Users"
npx --yes autocannon -c 200 -d 5 http://localhost:3000 > testing_observations/test_200.txt 2>&1

Write-Host "Test 3: 500 Users"
npx --yes autocannon -c 500 -d 5 http://localhost:3000 > testing_observations/test_500.txt 2>&1

Write-Host "Test 4: 1000 Users"
npx --yes autocannon -c 1000 -d 5 http://localhost:3000 > testing_observations/test_1000.txt 2>&1

Write-Host "All tests completed!"
