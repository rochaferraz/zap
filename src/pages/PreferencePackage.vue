<!--
Copyright (c) 2008,2020 Silicon Labs.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
<template>
  <div>
    <div class="text-h4 q-mb-md">Zcl packages</div>
    <p>Zcl packages.</p>
    <q-table
      class="my-sticky-header-table"
      :rows="packages"
      :columns="columns"
      v-model:pagination="pagination"
      row-key="<b>name</b>"
      dense
      flat
      virtual-scroll
      binary-state-sort
      data-cy="Attributes"
      style="height: calc(100vh - 210px); overflow: hidden"
    >
      <template v-slot:pagination> </template>
    </q-table>
  </div>
</template>
<script>
export default {
  name: 'PreferencePackage',
  data() {
    return {
      columns: [
        {
          name: 'CATEGORY',
          align: 'left',
          label: 'Category',
          field: 'category',
        },
        {
          name: 'DESCRIPTION',
          align: 'left',
          label: 'Description',
          field: 'description',
        },
        {
          name: 'PATH',
          align: 'left',
          label: 'Path',
          field: 'path',
        },
        {
          name: 'TYPE',
          align: 'left',
          label: 'Type',
          field: 'type',
        },
        {
          name: 'VERSION',
          align: 'left',
          label: 'Version',
          field: 'version',
        },
      ],
    }
  },
  computed: {
    packages: {
      get() {
        return this.$store.state.zap.allPackages
      },
    },
    pagination: {
      get() {
        return {
          sortBy: 'desc',
          descending: false,
          page: 1,
          rowsPerPage: this.$store.state.zap.allPackages.length,
        }
      },
    },
  },
}
</script>
