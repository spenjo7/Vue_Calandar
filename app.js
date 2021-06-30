/* Try to do a Calendar on a Grid with the dates inserted*/

const getDateStats = (baseDate = null) => {
	let d;
	if(baseDate === null){
		d = new Date()
	} else {
		d = new Date(baseDate)
	}
	
	let yyyy = d.getFullYear()
	let date = d.getDate() // day of month: 1 - 31 or whatever
	let dow = d.getDay() // day of week: 0-6
	let dd = `0${date}`.slice(-2) // zero-ified version of date

	let js_month = d.getMonth() // js months are 0 -11 // going to need this as an integer shortly 
	let month = js_month +1 
	let mm = `0${js_month +1}`.slice(-2) // zero-ified and normalized version of month

	let stamp = [yyyy,mm,dd].join('_')
	// console.log([yyyy, dd, mm, stamp, date, dow, js_month])

	return { yyyy, dd, mm, stamp, date, dow, js_month } // passing multiple version of date/month info for different purposes
}

const getDateRange = (baseDate = null) => {
	let baseDate_info = getDateStats(baseDate)
	let { yyyy, dd, mm, stamp, date, dow, js_month } = baseDate_info

	// Month Range Logic //

	let last_day_of_current_month = new Date(yyyy, mm, 0)
	let days_in_current_month = last_day_of_current_month.getDate()
	let dow_current_month_end = last_day_of_current_month.getDay()

	let current_month_range = Array.from({length: days_in_current_month}, (_,i) => i+1) // An array for all the days of the month

		// Trailing days are easy because we don't need to know how long the next month is	
	let trailing_days = (6 - dow_current_month_end )
	let next_month_partial_range = Array.from({length: trailing_days }, (_,i) => i+1) // if no trailing days array is empty

		// Leading days are harder because we need to know how long the prior month was
	let last_day_of_prior_month = new Date(yyyy, js_month, 0)
	let days_in_prior_month = last_day_of_prior_month.getDate()
	let dow_prior_month_end = last_day_of_prior_month.getDay()
	//let dow_current_month_start = (dow_prior_month_end + 1) % 7 

	let leading_days = (dow_prior_month_end + 1) % 7
		// ^ We technically want to know if the current month started on a Sunday, but 6/7 times we will need to know how long the prior month was
		// So we use this to avoid another round of creating a date object 

	let prior_month_partial_range = Array.from({ length: leading_days }, (_,i) => days_in_prior_month - dow_prior_month_end + i)

	let padded_current_month_range = [ ...prior_month_partial_range, ...current_month_range, ...next_month_partial_range]
	let baseDate_padded_index = prior_month_partial_range.length + date -1 // might be needed later

	// Week Range Logic //
	let current_week_start_padded_index = baseDate_padded_index - dow
	let current_week_end_padded_index = current_week_start_padded_index + 7
	let current_week_range = padded_current_month_range.slice(current_week_start_padded_index, current_week_end_padded_index )//.slice(-7)

	// let week_of_month = Math.ceil(dd / 7 ) // 1 to 5 for our purposes


	return {
		baseDate,
		baseDate_info,
		current_week_range,
		current_month_range,
		padded_current_month_range,
		baseDate_padded_index,
		//week_of_month,
		leading_days,
		trailing_days,
		current_week_start_padded_index,
		current_week_end_padded_index
	}
}




Vue.component('cal-cell', {
	props: ['date'],
	methods: {

	},
	template: `<div>
		<h3>{{date}}</h3>
	</div>`
})

new Vue({
	el: '#app',
	data: {
		days: [],
		headers: [ 
			{ dow: "Sunday" },
			{ dow: "Monday" },
			{ dow: "Tuesday"},
			{ dow: "Wednesday"},
			{ dow: "Thursday"},
			{ dow: "Friday" },
			{ dow: "Saturday" }
		],
		dateStamp: ""
	},
	methods: {
		update(baseDate = null){
			
			let date_range_info = getDateRange(baseDate)
			let { baseDate_info, 
				padded_current_month_range, 
				baseDate_padded_index, 
				leading_days, trailing_days, 
				current_week_start_padded_index, 
				current_week_end_padded_index 
			} = date_range_info
			
			let trailing_start_index = padded_current_month_range.length - trailing_days

			this.days = padded_current_month_range.map( (n,ind) => {
				const details = { 
					day_of_month: n, 
					isBaseDate: (ind === baseDate_padded_index),
					isCurrentWeek: ( ind >= current_week_start_padded_index && ind <= current_week_end_padded_index  ),
					isPadding: ( ind < leading_days || ind >= trailing_start_index )
				}
				
				return details 
			})
			
			this.dateStamp = baseDate_info.stamp
		}
	},
	created: function () {
		this.update(this.baseDate)
	},
	template: `
		<div>
			<div class="grid">
				<div
					class="cell_header full_row"
				>
					<h1>{{ dateStamp }}</h1>
				</div>
				<div
					v-for="header in headers"
					:key="header.dow"
					class="cell_header"
				><h3>{{ header.dow }}</h2></div>

				<cal-cell
					v-for="day in days"
					v-bind:date="day.day_of_month"
					v-bind:class="{ inactive: day.isPadding, currentDay: day.isBaseDate, currentWeek: day.isCurrentWeek }"
				></cal-cell>
			</div>
	</div>`
})