window.addEventListener('DOMContentLoaded', function () {
    enableProjectFilters({
        projectItemSelector: '.projects__item'
    });

    function enableProjectFilters(opts) {
        var filterButtons = Array.from(document.querySelectorAll('[data-project-filter'))
            .reduce(function (aggr, btn) {
                var attribute = btn.getAttribute('data-project-filter');
                var filterValue = attribute.toLowerCase();
                aggr[filterValue] = {
                    value: filterValue,
                    el: btn,
                }

                btn.addEventListener('click', onFilterClick(filterValue));
                return aggr;
            }, { 'all': { value: 'all' } });

        var projects = document.querySelectorAll(opts.projectItemSelector);

        var pageDefaultFilter = 'all';
        var activeFilter = (getUrlParameterByName('filter') || pageDefaultFilter).toLowerCase();
        filterProjects(activeFilter);

        function getUrlParameterByName(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        }

        function onFilterClick(filterValue) {
            return function () {
                if (activeFilter === filterValue) {
                    return;
                }
                filterProjects(filterValue);
            }
        }

        function filterProjects(filter) {
            if (filterButtons[filter] == null) {
                console.warn('Filter ' + filter + ' does not exist');
                activeFilter = pageDefaultFilter;
                return;
            }

            filterButtons[activeFilter].el.classList.remove('is-selected');
            filterButtons[filter].el.classList.add('is-selected');

            activeFilter = filter;
            if (filter === pageDefaultFilter) {
                projects.forEach(function (projectEl) { projectEl.style.display = 'flex'; });
                return;
            }

            projects.forEach(function (projectEl) {
                var projectCategoryElements = projectEl.querySelectorAll('[data-project-filter-value]');
                if (projectCategoryElements == null || projectCategoryElements.length == 0) {
                    return;
                }

                var projectCategoriesStr = Array.from(
                    projectCategoryElements,
                    function (el) { return el.getAttribute('data-project-filter-value').toLowerCase(); }
                ).join(', ');
                var shouldBeDisplayed = projectCategoriesStr.includes(filter);

                projectEl.style.display = shouldBeDisplayed ? 'flex' : 'none';
            });
        }
    }
});