cmake_minimum_required(VERSION 3.15)
project(FleetManagementSystem)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include directories
include_directories(${PROJECT_SOURCE_DIR}/src)
include_directories(${PROJECT_SOURCE_DIR}/src/core)
include_directories(${PROJECT_SOURCE_DIR}/src/data_structures)
include_directories(${PROJECT_SOURCE_DIR}/src/services)

# Collect all source files
file(GLOB_RECURSE SOURCES 
    "src/*.cpp"
    "src/core/*.cpp"
    "src/data_structures/*.cpp"
    "src/services/*.cpp"
)

# Create executable
add_executable(fleet_management ${SOURCES})

# Enable warnings
if(MSVC)
    target_compile_options(fleet_management PRIVATE /W4)
else()
    target_compile_options(fleet_management PRIVATE -Wall -Wextra -Wpedantic)
endif()
