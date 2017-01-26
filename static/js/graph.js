queue()  // Used when dealing with data from multiple APIs. Not needed here but good practice
    .defer(d3.json, "/donorsUS/projects")
    .await(makeGraphs);

function makeGraphs(error, projectsJson) {

    //Clean projectsJson data
    var donorsUSProjects = projectsJson;
    var dateFormat = d3.time.format("%Y-%m-%d %H:%M:%S");
    donorsUSProjects.forEach(function (d) {
        d["date_posted"] = dateFormat.parse(d["date_posted"]);
        d["date_posted"].setDate(1);
        d["total_donations"] = +d["total_donations"];  // The + sets the datatype as a number
        d["students_reached"] = +d["students_reached"];  // NEW
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
    var totalDonationsDim = ndx.dimension(function (d) {
        return d["total_donations"];
    });
    var gradeLevel = ndx.dimension(function (d) {
        return d["grade_level"];
    });
    var studentsReachedDim = ndx.dimension(function (d) {  // NEW
        return d["students_reached"];
    });


    //Calculate metrics
    var numProjectsByDate = dateDim.group();
    var numProjectsByResourceType = resourceTypeDim.group();
    var numProjectsByPrimaryArea = primaryAreaDim.group();
    var numProjectsByPovertyLevel = povertyLevelDim.group();
    var numProjectsByGradeLevel = gradeLevel.group();
    var totalDonationsByState = stateDim.group().reduceSum(function (d) {
        return d["total_donations"];
    });
    var studentsReachedByState = stateDim.group().reduceSum(function (d) {  // NEW
        return d["students_reached"];
    });
    var stateGroup = stateDim.group();


    var all = ndx.groupAll();
    var totalDonations = ndx.groupAll().reduceSum(function (d) {
        return d["total_donations"];
    });
    var studentsReached = ndx.groupAll().reduceSum(function (d) {  // NEW
        return d["students_reached"];
    });

    var max_state = totalDonationsByState.top(1)[0].value;

    //Define values (to be used in charts)
    var minDate = dateDim.bottom(1)[0]["date_posted"];
    var maxDate = dateDim.top(1)[0]["date_posted"];

    //Charts
    var timeChart = dc.lineChart("#time-chart");
    var resourceTypeChart = dc.rowChart("#resource-type-row-chart");
    var primaryAreaChart = dc.rowChart("#primary-area-row-chart");
    var povertyLevelChart = dc.pieChart("#poverty-level-chart");
    var numberProjectsND = dc.numberDisplay("#number-projects-nd");
    var totalDonationsND = dc.numberDisplay("#total-donations-nd");
    var gradeLevelChart = dc.pieChart("#grade-chart");
    var studentsReachedND = dc.numberDisplay("#students-reached-nd");  // NEW


    selectField = dc.selectMenu('#menu-select')
        .dimension(stateDim)
        .group(stateGroup);

    numberProjectsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(all);

    totalDonationsND
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(totalDonations)
        .formatNumber(d3.format(".3s"));

    studentsReachedND  // NEW
        .formatNumber(d3.format("d"))
        .valueAccessor(function (d) {
            return d;
        })
        .group(studentsReached)
        .formatNumber(d3.format(".3s"));

    timeChart
        .ordinalColors(["#C96A23"])
        .width(1200)
        .height(300)
        .margins({top: 30, right: 50, bottom: 30, left: 50})
        .dimension(dateDim)
        .group(numProjectsByDate)
        .renderArea(true)
        .transitionDuration(500)
        .x(d3.time.scale().domain([minDate, maxDate]))
        .elasticY(true)
        .xAxisLabel("Year")
        .yAxis().ticks(6);


    resourceTypeChart
        .ordinalColors(["#79CED7", "#66AFB2", "#C96A23", "#D3D1C5", "#F5821F"])
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByResourceType)
        .xAxis().ticks(4);

    primaryAreaChart
        .ordinalColors(["#79CED7", "#66AFB2", "#C96A23", "#D3D1C5", "#F5821F"])
        .width(300)
        .height(250)
        .dimension(resourceTypeDim)
        .group(numProjectsByPrimaryArea)
        .xAxis().ticks(4);

    povertyLevelChart
        .ordinalColors(["#79CED7", "#66AFB2", "#C96A23", "#D3D1C5", "#F5821F"])
        .height(220)
        .radius(90)
        .innerRadius(0)  // changed from 40 to make standard pie chart
        .transitionDuration(1500)
        .dimension(gradeLevel)
        .group(numProjectsByPovertyLevel)
        .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5));  // adds a legend
        //.cx(numerical value) use to move doughnut on x axis to clear legend
        //.cy(num)

    gradeLevelChart
        .ordinalColors(["#79CED7", "#66AFB2", "#C96A23", "#D3D1C5", "#F5821F"])
        .height(220)
        .radius(90)
        .innerRadius(0)  // changed from 40 to make standard pie chart
        .transitionDuration(1500)
        .dimension(gradeLevel)
        .group(numProjectsByGradeLevel)
        .legend(dc.legend().x(50).y(10).itemHeight(13).gap(5));  // adds a legend
        //.cx(numerical value) use to move doughnut on x axis to clear legend
        //.cy(num)

    dc.renderAll();

}