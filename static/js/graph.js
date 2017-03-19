queue()  // Used when dealing with data from multiple APIs. Not needed here but good practice
    .defer(d3.json, "/donorsUS/projects")
    .await(makeGraphs);


// Charts
// code moved into global scope
var timeChart = dc.lineChart("#time-chart");
var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
var primaryAreaChart = dc.rowChart("#primary-area-row-chart");
var povertyLevelChart = dc.pieChart("#poverty-level-chart");
var numberProjectsND = dc.numberDisplay("#number-projects-nd");
var totalDonationsND = dc.numberDisplay("#total-donations-nd");
var gradeLevelChart = dc.pieChart("#grade-level-chart");
var studentsReachedND = dc.numberDisplay("#students-reached-nd");
var schoolsAssistedND = dc.numberDisplay("#schools-assisted-nd");

function makeGraphs(error, projectsJson) {

    //Clean projectsJson data
    var donorsUSProjects = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    donorsUSProjects.forEach(function (d) {
        d["date_posted"] = dateFormat.parse(d["date_posted"]);
        d["date_posted"].setDate(1);
        d["total_donations"] = +d["total_donations"];  // The + sets the datatype as a number
        d["students_reached"] = +d["students_reached"];
    });

    //Create a Crossfilter instance
    var ndx = crossfilter(donorsUSProjects);

    //Define Dimensions
    var dateDim = ndx.dimension(function (d) {
        return d["date_posted"];
    });
    var resourceTypeDim = ndx.dimension(function (d) {
        return d["resource_type"];
    });
    var primaryAreaDim = ndx.dimension(function (d) {
        return d["primary_focus_area"];
    });
    var povertyLevelDim = ndx.dimension(function (d) {
        return d["poverty_level"];
    });
    var stateDim = ndx.dimension(function (d) {
        return d["school_state"];
    });
    var gradeLevelDim = ndx.dimension(function (d) {
        return d["grade_level"];
    });


    //Calculate metrics
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPrimaryArea = primaryAreaDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByGradeLevel = gradeLevelDim.group();
    var totalDonationsByState = stateDim.group().reduceSum(function (d) {
        return d["total_donations"];
    });
    var stateGroup = stateDim.group();


    var all = ndx.groupAll();
    var totalDonations = ndx.groupAll().reduceSum(function (d) {
        return d["total_donations"];
    });
    var studentsReached = ndx.groupAll().reduceSum(function (d) {
        return d["students_reached"];
    });
    // Code taken from http://stackoverflow.com/questions/31686248/number-of-unique-values-using-crossfilter
    var schoolsAssisted = ndx.groupAll().reduce(
        function (p, d) {
            if(d._schoolid in p.ids){
                p.ids[d._schoolid] += 1
            }
            else{
                p.ids[d._schoolid] = 1;
                p.id_count++;
            }
            return p;
        },

        function (p, d) {
            p.ids[d._schoolid]--;
            if(p.ids[d._schoolid] === 0){
                delete p.ids[d._schoolid];
                p.id_count--;
            }
            return p;
        },

        function () {
                return {ids: {},
                id_count: 0};
            });

    var max_state = totalDonationsByState.top(1)[0].value;

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0]["date_posted"];  // To calculate the x axis range
    var maxDate = dateDim.top(1)[0]["date_posted"];

    //Format large numbers to include commas
    var addCommas = (d3.format("n"));

    selectField = dc.selectMenu('#menu-select')
        .dimension(stateDim)
        .group(stateGroup)
        .title(function(d) {
                var stateNames = {
                    AK: 'Alaska',
                    AL: 'Alabama',
                    AR: 'Arkansas',
                    AZ: 'Arizona',
                    CA: 'California',
                    CO: 'Colorado',
                    CT: 'Connecticut',
                    DC: 'District of Columbia',
                    DE: 'Delaware',
                    FL: 'Florida',
                    GA: 'Georgia',
                    HI: 'Hawaii',
                    IA: 'Iowa',
                    ID: 'Idaho',
                    IL: 'Illinois',
                    IN: 'Indiana',
                    KS: 'Kansas',
                    KY: 'Kentucky',
                    LA: 'Louisiana',
                    MA: 'Massachusetts',
                    MD: 'Maryland',
                    ME: 'Maine',
                    MI: 'Michigan',
                    MN: 'Minnesota',
                    MO: 'Missouri',
                    MS: 'Mississippi',
                    MT: 'Montana',
                    NC: 'North Carolina',
                    ND: 'North Dakota',
                    NE: 'Nebraska',
                    NH: 'New Hampshire',
                    NJ: 'New Jersey',
                    NM: 'New Mexico',
                    NV: 'Nevada',
                    NY: 'New York',
                    OH: 'Ohio',
                    OK: 'Oklahoma',
                    OR: 'Oregon',
                    PA: 'Pennsylvania',
                    RI: 'Rhode Island',
                    SC: 'South Carolina',
                    SD: 'South Dakota',
                    TN: 'Tennessee',
                    TX: 'Texas',
                    UT: 'Utah',
                    VA: 'Virginia',
                    VT: 'Vermont',
                    WA: 'Washington',
                    WI: 'Wisconsin',
                    WV: 'West Virginia',
                    WY: 'Wyoming'
                };
                return stateNames[d.key] + ' (' + d.value + ')';
            });

    numberProjectsND
        .formatNumber(d3.format("n"))  // In the format [​[fill]align][sign][symbol][0][width][,][.precision][type] with "n" being shorthand for ",g"
        .valueAccessor(function (d) {
            return d;
        })
        .group(all);

    totalDonationsND
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalDonations)
        .formatNumber(d3.format("$n"));

    schoolsAssistedND
        .formatNumber(d3.format("n"))
        .valueAccessor(function (d) {
            return d.id_count;
        })
        .group(schoolsAssisted);

    studentsReachedND
        .valueAccessor(function (d) {
            return d;
        })
        .group(studentsReached)
        .formatNumber(d3.format("n"));  // In the format [​[fill]align][sign][symbol][0][width][,][.precision][type]

    timeChart
        .ordinalColors(["#FF4500"])
        .width(780)
        .height(300)
        .margins({top: 30, right: 50, bottom: 30, left: 50})
        .dimension(dateDim)
        .group(numProjectsByDate)
        .renderArea(true)
        .transitionDuration(1500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .elasticX(true)
        .xAxisLabel("Year")
        .renderHorizontalGridLines(true)
        .renderVerticalGridLines(true)
        .yAxis().ticks(6);


    resourceTypeChart
        .ordinalColors(["#ffa500", "#ffa500", "#ffa500", "#ffa500", "#ffa500", "#ffa500", "#ffa500"])
        .width(370)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .transitionDuration(1500)
        .elasticX(true)
        .title(function (d) {  // Displayed in tooltip
            return addCommas(d.value);
        })
        .label(function (d) {  // Displayed on the chart
            if (resourceTypeChart.hasFilter() && !resourceTypeChart.hasFilter(d.key)) {
                return '0%';
            }
            if (all.value()) {
                var label = Math.floor(d.value / all.value() * 100) + '%';
            }
            return d.key + " (" + label + ")";
        })
        .xAxis().ticks(4);

    primaryAreaChart
        .ordinalColors(["#ff2189", "#ff2189", "#ff2189", "#ff2189", "#ff2189", "#ff2189"])
        .width(370)
        .height(250)
        .dimension(primaryAreaDim)
        .group(numProjectsByPrimaryArea)
        .transitionDuration(1500)
        .elasticX(true)
        .title(function (d) {  // Displayed in tooltip
            return addCommas(d.value);
        })
        .label(function (d) {  // Displayed on the chart
            if (primaryAreaChart.hasFilter() && !primaryAreaChart.hasFilter(d.key)) {
                return '0%';
            }
            if (all.value()) {
                var label = Math.floor(d.value / all.value() * 100) + '%';
            }
            return d.key + " (" + label + ")";
        })
        .xAxis().ticks(4);

    povertyLevelChart
        .ordinalColors(['#ffff00', '#ffff4c', '#ffff99', '#ffffcc'])
        .height(250)
        .width(325)
        .radius(100)
        .innerRadius(0)  // changed from 40 to make standard pie chart
        .transitionDuration(1500)
        .dimension(povertyLevelDim)
        .group(numProjectsByPovertyLevel)
        .legend(dc.legend().x(10).y(10).itemHeight(13).gap(5))  // adds a legend
        .cx(215)  // moves doughnut on x axis to clear legend
        .label(function (d) {  // Displayed on the chart
                if (povertyLevelChart.hasFilter() && !povertyLevelChart.hasFilter(d.key)) {
                    return '0%';
                }
                if (all.value()) {
                    var label = Math.floor(d.value / all.value() * 100) + '%';
                }
                return label;
            })
        .title(function (d) {  // Displayed in tooltip
            return d.key + ': ' + addCommas(d.value);
        })
        .ordering(function (d) {
            switch (d.key) {
                case "highest poverty":
                    return 0;
                case "high poverty":
                    return 1;
                case "moderate poverty":
                    return 2;
                case "low poverty":
                    return 3;
            }
        });


    gradeLevelChart
        .ordinalColors(['#beffaa', '#72ff5e', '#3fee2b', '#00a100'])
        .height(250)
        .width(325)
        .radius(100)
        .innerRadius(0)  // changed from 40 to make standard pie chart
        .transitionDuration(1500)
        .dimension(gradeLevelDim)
        .group(numProjectsByGradeLevel)
        .legend(dc.legend().x(10).y(10).itemHeight(13).gap(5))  // adds a legend
        .cx(215)  // moves pie chart on x axis to clear legend
        .label(function (d) {  // Displayed on the chart
            if (gradeLevelChart.hasFilter() && !gradeLevelChart.hasFilter(d.key)) {
                return '0%';
            }
            if (all.value()) {
                var label = Math.floor(d.value / all.value() * 100) + '%';
            }
            return label;
        })
        .title(function (d) {  // Displayed in tooltip
            return d.key + ': ' + addCommas(d.value);
        })
        .ordering(function (d) {
            switch (d.key) {
                case "Grades PreK-2":
                    return 0;
                case "Grades 3-5":
                    return 1;
                case "Grades 6-8":
                    return 2;
                case "Grades 9-12":
                    return 3;
            }
        });

    dc.renderAll();

}