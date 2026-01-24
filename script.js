document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const dobInput = document.getElementById('dob');
    const intervalValueInput = document.getElementById('interval-value');
    const intervalUnitSelect = document.getElementById('interval-unit');
    const errorMsg = document.getElementById('error-msg');
    const resultsSection = document.getElementById('results-section');
    
    // Set max date to today
    dobInput.max = new Date().toISOString().split("T")[0];

    calculateBtn.addEventListener('click', () => {
        // Reset state
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
        resultsSection.classList.add('hidden');

        // Inputs
        const dobStr = dobInput.value;
        const val = parseFloat(intervalValueInput.value);
        const unit = intervalUnitSelect.value; // years, months, weeks, days

        // Validation
        if (!dobStr) {
            showError("Please enter your Date of Birth.");
            return;
        }
        if (isNaN(val) || val <= 0) {
            showError("Please enter a valid positive number for the time interval.");
            return;
        }

        const dob = new Date(dobStr);
        const now = new Date();

        if (dob >= now) {
            showError("Date of Birth must be in the past.");
            return;
        }

        // 1. Calculate Exact Age Breakdown
        const ageDetails = getExactAge(dob, now);
        // Display Exact Age
        document.getElementById('exact-age').textContent = formatDuration(ageDetails);

        // 2. Calculate Total Days Alive (Approx for Ratio)
        // We use the difference in time to get pure milliseconds, then days
        const ageInMs = now - dob;
        const ageInDays = ageInMs / (1000 * 60 * 60 * 24);

        // 3. Calculate Interval in Days
        let intervalDays = 0;
        switch(unit) {
            case 'years': intervalDays = val * 365.25; break;
            case 'months': intervalDays = val * 30.44; break;
            case 'weeks': intervalDays = val * 7; break;
            case 'days': intervalDays = val; break;
        }

        // 4. Calculate Ratio
        const ratio = intervalDays / ageInDays;
        
        // Update Visualization
        const percentage = (ratio * 100).toFixed(2);
        
        // Clamp stroke for circle (0 to 100)
        let strokeVal = ratio * 100;
        // The stroke-dasharray is "current, 100". 
        // If > 100, the circle just fills completely (or loops if we handled it, but fill is fine)
        if (strokeVal > 100) strokeVal = 100; // Cap visual fill at 100%
        
        document.getElementById('percent-display').textContent = percentage + "%";
        document.getElementById('percent-text').textContent = (ratio * 100).toFixed(1) + "%";
        document.getElementById('input-interval-text').textContent = `${val} ${unit}`;
        
        // Update Circle Animation
        // We need to re-trigger animation or just set styles. 
        // Simple way: set the attribute directly.
        const circle = document.getElementById('circle-stroke');
        // Reset first to re-trigger if needed, but simple attribute set works
        circle.setAttribute('stroke-dasharray', `${strokeVal}, 100`);
        // Color shift based on intensity
        if (ratio > 0.5) circle.style.stroke = "#ff0055"; // Red/Intense for long periods
        else circle.style.stroke = "#00f2ff"; // Blue/Standard

        // 5. Generate Comparisons
        generateComparisons(ratio);

        // Show Results
        resultsSection.classList.remove('hidden');
        resultsSection.style.display = 'block'; // Ensure block for animation
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    /**
     * Calculates precise age in Years, Months, Weeks, Days
     */
    function getExactAge(startDate, endDate) {
        let years = endDate.getFullYear() - startDate.getFullYear();
        let months = endDate.getMonth() - startDate.getMonth();
        let days = endDate.getDate() - startDate.getDate();

        if (days < 0) {
            months--;
            // Get days in previous month
            const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
            days += prevMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        // Convert remaining days to weeks and days
        const weeks = Math.floor(days / 7);
        const remainingDays = days % 7;

        return { years, months, weeks, days: remainingDays };
    }

    function formatDuration(obj) {
        const parts = [];
        if (obj.years > 0) parts.push(`${obj.years} year${obj.years !== 1 ? 's' : ''}`);
        if (obj.months > 0) parts.push(`${obj.months} month${obj.months !== 1 ? 's' : ''}`);
        if (obj.weeks > 0) parts.push(`${obj.weeks} week${obj.weeks !== 1 ? 's' : ''}`);
        if (obj.days > 0) parts.push(`${obj.days} day${obj.days !== 1 ? 's' : ''}`);
        
        if (parts.length === 0) return "0 days";
        return parts.join(', ');
    }

    /**
     * Converts total days back into a structure {years, months, weeks, days}
     * for abstract durations (not calendar bound).
     * Using standard averages: Year=365.25, Month=30.44
     */
    function daysToDuration(totalDays) {
        let d = totalDays;
        
        const years = Math.floor(d / 365.25);
        d -= years * 365.25;
        
        const months = Math.floor(d / 30.44);
        d -= months * 30.44;
        
        const weeks = Math.floor(d / 7);
        d -= weeks * 7;
        
        const days = Math.floor(d);

        return { years, months, weeks, days };
    }

    function generateComparisons(ratio) {
        const container = document.getElementById('comparison-container');
        container.innerHTML = '';

        // Define reference ages in Years
        const refAges = [2, 7, 10, 15, 20, 30, 40, 60, 80];

        refAges.forEach(age => {
            // How long is this ratio for a person of 'age'?
            // Duration = AgeInDays * Ratio
            const refAgeDays = age * 365.25;
            const subjectiveDurationDays = refAgeDays * ratio;
            
            const durationObj = daysToDuration(subjectiveDurationDays);
            const durationStr = formatDuration(durationObj);

            // Create Card
            const card = document.createElement('div');
            card.className = 'comp-card';
            card.innerHTML = `
                <div class="comp-age">To a ${age} year old</div>
                <div class="comp-duration">${durationStr}</div>
                <div class="comp-age" style="margin-top:0.5rem; font-size:0.8rem; opacity:0.7">feels like your interval</div>
            `;
            container.appendChild(card);
        });
    }
});
