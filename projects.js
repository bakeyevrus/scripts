window.addEventListener('DOMContentLoaded', function () {
    enableProjectFilters();

    function enableProjectFilters() {
        var filterLabelEl = document.querySelector('[data-project-filter-label]');
        if (filterLabelEl == null) {
            throw new Error("DOM element with attribute 'data-project-filter-label' doesn't exist");
        }
        var projects = document.querySelectorAll('.sec-project__item');

        var pageDefaultFilter = 'all projects';
        var activeFilter = getUrlParameterByName('filter') || pageDefaultFilter;

        if (activeFilter !== pageDefaultFilter) {
            filterProjects(activeFilter);
        }

        document.querySelectorAll('[data-project-filter]').forEach(function (el) {
            var filterValue = el.getAttribute('data-project-filter');
            el.addEventListener('click', onFilterClick(filterValue));
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
            filter = filter.toLowerCase();
            if (filter === pageDefaultFilter) {
                projects.forEach(function (projectEl) { projectEl.style.display = 'flex'; });
                return;
            }

            projects.forEach(function (projectEl) {
                var projectCategoriesEl = projectEl.querySelector('[data-project-categories]');
                if (projectCategoriesEl == null) {
                    return;
                }

                var projectCategoriesStr = projectCategoriesEl.projectgetAttribute('data-project-categories')
                var shouldBeDisplayed = projectCategoriesStr != null && projectCategoriesStr.toLowerCase().includes(filter.toLowerCase());
                projectEl.style.display = shouldBeDisplayed ? 'flex' : 'none';
            });
        }
    }
});