Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  AI Mentor Backend -- Full API Test Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$BASE = "http://127.0.0.1:5000"
$script:pass = 0
$script:fail = 0

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = ""
    )
    try {
        if ($Method -eq "GET") {
            $res = Invoke-RestMethod -Method GET -Uri $Url -ErrorAction Stop
        } else {
            $res = Invoke-RestMethod -Method POST -Uri $Url `
                -ContentType "application/json" -Body $Body -ErrorAction Stop
        }
        Write-Host "  [PASS] $Name" -ForegroundColor Green
        $script:pass++
        return $res
    } catch {
        Write-Host "  [FAIL] $Name" -ForegroundColor Red
        Write-Host "         $($_.Exception.Message)" -ForegroundColor DarkRed
        $script:fail++
        return $null
    }
}

# ── 1. Health Check ──────────────────────────────────────────────────────────
Write-Host "-- Health Check --" -ForegroundColor Yellow
$r = Test-API -Name "GET /" -Method "GET" -Url "$BASE/"
if ($r) { Write-Host "     Version: $($r.version)" -ForegroundColor DarkGray }

# ── 2. Career Suggestion ─────────────────────────────────────────────────────
Write-Host "`n-- POST /api/get_career --" -ForegroundColor Yellow

$b = @{ interest = "coding and technology"; goal = "high salary"; rank = 8000 } | ConvertTo-Json
$r = Test-API -Name "Career: IT (coding + high salary, rank 8000)" -Method "POST" -Url "$BASE/api/get_career" -Body $b
if ($r) { Write-Host "     Category: $($r.data.suggested_category)  |  Branch: $($r.data.recommended_branch)" -ForegroundColor DarkGray }

$b = @{ interest = "government banking civil services"; goal = "job security"; rank = 50000 } | ConvertTo-Json
$r = Test-API -Name "Career: Govt (banking + job security, rank 50000)" -Method "POST" -Url "$BASE/api/get_career" -Body $b
if ($r) { Write-Host "     Category: $($r.data.suggested_category)" -ForegroundColor DarkGray }

$b = @{ interest = "startup product building"; goal = "own business start a company"; rank = 30000 } | ConvertTo-Json
$r = Test-API -Name "Career: Startup (startup + own business, rank 30000)" -Method "POST" -Url "$BASE/api/get_career" -Body $b
if ($r) { Write-Host "     Category: $($r.data.suggested_category)" -ForegroundColor DarkGray }

# ── 3. College Recommendation ────────────────────────────────────────────────
Write-Host "`n-- POST /api/get_colleges --" -ForegroundColor Yellow

$b = @{ rank = 500; branch = "Computer Science" } | ConvertTo-Json
$r = Test-API -Name "Colleges: Rank 500 (IIT eligible)" -Method "POST" -Url "$BASE/api/get_colleges" -Body $b
if ($r) { Write-Host "     Found: $($r.total_colleges_found) colleges" -ForegroundColor DarkGray }

$b = @{ rank = 8000; branch = "Computer Science" } | ConvertTo-Json
$r = Test-API -Name "Colleges: Rank 8000 (NIT range)" -Method "POST" -Url "$BASE/api/get_colleges" -Body $b
if ($r) { Write-Host "     Found: $($r.total_colleges_found) colleges  |  Top: $($r.colleges[0].name)" -ForegroundColor DarkGray }

$b = @{ rank = 80000; branch = "Computer Science" } | ConvertTo-Json
$r = Test-API -Name "Colleges: Rank 80000 (Private colleges)" -Method "POST" -Url "$BASE/api/get_colleges" -Body $b
if ($r) { Write-Host "     Found: $($r.total_colleges_found) colleges" -ForegroundColor DarkGray }

# ── 4. Roadmap ───────────────────────────────────────────────────────────────
Write-Host "`n-- POST /api/get_roadmap --" -ForegroundColor Yellow

$b = @{ career = "Software Engineer" } | ConvertTo-Json
$r = Test-API -Name "Roadmap: Software Engineer" -Method "POST" -Url "$BASE/api/get_roadmap" -Body $b
if ($r) { Write-Host "     Phases: $($r.roadmap.phases.Count)  |  Weeks: $($r.roadmap.total_weeks)" -ForegroundColor DarkGray }

$b = @{ career = "Data Analyst" } | ConvertTo-Json
$r = Test-API -Name "Roadmap: Data Analyst" -Method "POST" -Url "$BASE/api/get_roadmap" -Body $b
if ($r) { Write-Host "     Phases: $($r.roadmap.phases.Count)" -ForegroundColor DarkGray }

$b = @{ career = "AI/ML Engineer" } | ConvertTo-Json
$r = Test-API -Name "Roadmap: AI/ML Engineer" -Method "POST" -Url "$BASE/api/get_roadmap" -Body $b
if ($r) { Write-Host "     Phases: $($r.roadmap.phases.Count)" -ForegroundColor DarkGray }

# ── 5. AI Daily Tasks ────────────────────────────────────────────────────────
Write-Host "`n-- POST /api/ai_daily_tasks --" -ForegroundColor Yellow

$b = @{ career = "Software Engineer"; level = "beginner"; time = "2"; current_day = 1 } | ConvertTo-Json
$r = Test-API -Name "Daily Tasks: Beginner, Day 1" -Method "POST" -Url "$BASE/api/ai_daily_tasks" -Body $b
if ($r) { Write-Host "     Focus: $($r.tasks.focus_topic)" -ForegroundColor DarkGray }

$b = @{ career = "Data Analyst"; level = "intermediate"; time = "3"; current_day = 15 } | ConvertTo-Json
$r = Test-API -Name "Daily Tasks: Intermediate, Day 15" -Method "POST" -Url "$BASE/api/ai_daily_tasks" -Body $b
if ($r) { Write-Host "     Tasks: $($r.tasks.tasks.Count) task(s)" -ForegroundColor DarkGray }

# ── 6. AI Mentor ─────────────────────────────────────────────────────────────
Write-Host "`n-- POST /api/ai_mentor --" -ForegroundColor Yellow

$b = @{ career = "Software Engineer"; level = "beginner"; current_day = 1; time = "2" } | ConvertTo-Json
$r = Test-API -Name "AI Mentor: Software Engineer, Day 1" -Method "POST" -Url "$BASE/api/ai_mentor" -Body $b
if ($r) { Write-Host "     Session length: $(($r.mentor_session).Length) characters" -ForegroundColor DarkGray }

$b = @{ career = "AI/ML Engineer"; level = "intermediate"; current_day = 30; time = "4" } | ConvertTo-Json
$r = Test-API -Name "AI Mentor: AI/ML Engineer, Day 30" -Method "POST" -Url "$BASE/api/ai_mentor" -Body $b
if ($r) { Write-Host "     Session received" -ForegroundColor DarkGray }

# ── 7. Submit Assignment ─────────────────────────────────────────────────────
Write-Host "`n-- POST /api/submit_assignment --" -ForegroundColor Yellow

$b = @{ user_id = "student_001"; task_id = "day1_python_basics"; submission_text = "def add(a,b): return a+b`ndef subtract(a,b): return a-b`nprint(add(5,3))" } | ConvertTo-Json
$r = Test-API -Name "Submit: Python Calculator Code" -Method "POST" -Url "$BASE/api/submit_assignment" -Body $b
if ($r) { Write-Host "     Submission ID: $($r.submission.id)" -ForegroundColor DarkGray }

$b = @{ user_id = "student_001"; task_id = "day2_sql_basics"; submission_text = "SELECT name FROM employees WHERE dept='IT' ORDER BY salary DESC LIMIT 10;" } | ConvertTo-Json
$r = Test-API -Name "Submit: SQL Query" -Method "POST" -Url "$BASE/api/submit_assignment" -Body $b
if ($r) { Write-Host "     Status: $($r.submission.status)" -ForegroundColor DarkGray }

# ── 8. AI Feedback ───────────────────────────────────────────────────────────
Write-Host "`n-- POST /api/ai_feedback --" -ForegroundColor Yellow

$b = @{
    task = "Build a calculator with add, subtract, multiply, divide functions in Python"
    submission = "def add(a,b): return a+b`ndef subtract(a,b): return a-b`ndef multiply(a,b): return a*b`ndef divide(a,b): return a/b if b!=0 else None"
} | ConvertTo-Json
$r = Test-API -Name "Feedback: Complete Calculator" -Method "POST" -Url "$BASE/api/ai_feedback" -Body $b
if ($r) { Write-Host "     Score: $($r.feedback.score)/100  |  Grade: $($r.feedback.grade)" -ForegroundColor DarkGray }

$b = @{ task = "Build a full calculator"; submission = "def add(a,b): return a+b" } | ConvertTo-Json
$r = Test-API -Name "Feedback: Incomplete Submission" -Method "POST" -Url "$BASE/api/ai_feedback" -Body $b
if ($r) { Write-Host "     Score: $($r.feedback.score)/100" -ForegroundColor DarkGray }

# ── 9. Progress Tracking ─────────────────────────────────────────────────────
Write-Host "`n-- POST /api/update_progress  |  GET /api/get_progress --" -ForegroundColor Yellow

$b = @{ user_id = "student_001"; task_id = "day1_python_basics"; day = 1 } | ConvertTo-Json
$r = Test-API -Name "Update Progress: Day 1" -Method "POST" -Url "$BASE/api/update_progress" -Body $b
if ($r) { Write-Host "     Streak: $($r.progress.streak)  |  Completion: $($r.progress.completion_percentage)%  |  $($r.progress.streak_badge)" -ForegroundColor DarkGray }

$b = @{ user_id = "student_002"; task_id = "day2_control_flow"; day = 2 } | ConvertTo-Json
$r = Test-API -Name "Update Progress: New user Day 2" -Method "POST" -Url "$BASE/api/update_progress" -Body $b
if ($r) { Write-Host "     Next Unlock: $($r.progress.next_unlock)" -ForegroundColor DarkGray }

$r = Test-API -Name "Get Progress: student_001" -Method "GET" -Url "$BASE/api/get_progress/student_001"
if ($r) { Write-Host "     Day: $($r.progress.current_day)  |  Tasks: $($r.progress.total_tasks)  |  $($r.progress.completion_percentage)% done" -ForegroundColor DarkGray }

# ── Error Handling ───────────────────────────────────────────────────────────
Write-Host "`n-- Error Handling Tests --" -ForegroundColor Yellow

$b = @{ goal = "high salary" } | ConvertTo-Json
Test-API -Name "Missing 'interest' field -> expect 400" -Method "POST" -Url "$BASE/api/get_career" -Body $b | Out-Null

$b = @{ rank = "not-a-number"; branch = "Computer Science" } | ConvertTo-Json
Test-API -Name "Invalid rank type -> expect 400" -Method "POST" -Url "$BASE/api/get_colleges" -Body $b | Out-Null

Test-API -Name "Invalid endpoint -> expect 404" -Method "GET" -Url "$BASE/api/nonexistent" | Out-Null

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  RESULTS: $script:pass passed  |  $script:fail failed  |  $($script:pass + $script:fail) total" -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
