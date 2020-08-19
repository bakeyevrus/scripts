window.addEventListener('DOMContentLoaded', function () {
    enableProjectFilters({
        projectItemSelector: '.projects__item'
    });

    function enableProjectFilters(opts) {
        var filterLabelEl = document.querySelector('[data-project-filter-label]');
        if (filterLabelEl == null) {
            throw new Error("DOM element with attribute 'data-project-filter-label' doesn't exist");
        }
        var projects = document.querySelectorAll(opts.projectItemSelector);

        var pageDefaultFilter = 'all projects';
        var activeFilter = pageDefaultFilter;
        var queryFilter = getUrlParameterByName('filter');
        if (queryFilter != null) {
            activeFilter = queryFilter.toLowerCase();
            filterProjects(activeFilter);
        }

        document.querySelectorAll('[data-project-filter]').forEach(function (el) {
            var filterValue = el.getAttribute('data-project-filter');
            el.addEventListener('click', onFilterClick(filterValue.toLowerCase()));
        });

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
                activeFilter = filterValue;
                filterProjects(filterValue);
            }
        }

        function filterProjects(filter) {
            filterLabelEl.innerText = filter;

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